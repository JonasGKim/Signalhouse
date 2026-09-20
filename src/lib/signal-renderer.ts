/** Full-frame GPU refraction of original artwork. No animation loop runs at rest. */
const vertexSource = `
attribute vec2 a_position;
varying vec2 v_uv;
void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}
`;
const fragmentSource = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_metal;
uniform sampler2D u_instruments;
uniform vec2 u_size;
uniform float u_progress;
uniform float u_imageAspect;
uniform float u_cropX;
mat2 rotate(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
vec3 crystal(vec2 uv){
 float ratio=(u_size.x/u_size.y)/u_imageAspect;
 vec2 q=uv-.5;if(ratio<1.)q.x*=ratio;else q.y/=ratio;
 q+=vec2(.5+(u_cropX-.5)*(1.-min(ratio,1.)),.5);
 q+=vec2(sin(u_progress*12.)*.025,0.);
 return texture2D(u_metal,q).rgb;
}
vec3 instrument(float stage,vec2 uv,float phase){
 float aspect=u_size.x/u_size.y;
 vec2 center=aspect<1.?vec2(.56,.32):vec2(.74,.49);
 vec2 q=(uv-center)*vec2(aspect,1.);
 float size=aspect<1.?.62:.85;
 q/=size;
 // Tangible movement: bellows breathe, optics turn, the balance settles,
 // and successive archive plates slide into alignment.
 float wave=sin(phase*6.28318);
 if(stage<.5)q/=1.+wave*.035;
 else if(stage<1.5){q=rotate(wave*.07)*q;q.x/=1.+wave*.06;}
 else if(stage<2.5){float top=1.-smoothstep(-.2,.25,q.y);q=rotate(wave*.055*top)*q;}
 else {q.x+=sin(q.y*2.+phase*3.14)*.045;}
 q=q/vec2(1.5,1.)+.5;
 if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)return vec3(0.);
 vec2 cell=vec2(mod(stage,2.),floor(stage/2.));
 vec2 atlas=(cell+clamp(q,.002,.998))*.5;
 vec3 color=texture2D(u_instruments,atlas).rgb;
 float light=.95+.08*sin(phase*3.14);
 return color*light;
}
vec3 scene(float stage,vec2 uv,float phase){if(stage<.5)return crystal(uv);return instrument(stage-1.,uv,phase);}
void main(){
 vec2 uv=vec2(v_uv.x,1.-v_uv.y);
 float position=min(4.999,u_progress*5.);
 float stage=floor(position);
 float phase=fract(position);
 float blend=smoothstep(.79,1.,phase);
 vec3 current=scene(stage,uv,phase);
 vec3 next=scene(min(stage+1.,4.),uv,0.);
 // A controlled optical dissolve connects the materials, without liquid distortion.
 gl_FragColor=vec4(mix(current,next,blend),1.);
}
`;

export interface SignalRenderer {
  draw(progress: number): void;
  resize(width: number, height: number): void;
  dispose(): void;
}

export async function createSignalRenderer(
  canvas: HTMLCanvasElement,
): Promise<SignalRenderer | null> {
  const context = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  });
  if (!context) return null;
  const gl = context;
  const shaders: WebGLShader[] = [];
  const textures: WebGLTexture[] = [];
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  function dispose() {
    textures.forEach((texture) => gl.deleteTexture(texture));
    shaders.forEach((shader) => gl.deleteShader(shader));
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  }
  function compile(type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) throw Error('Shader unavailable');
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed');
    return shader;
  }
  try {
    program = gl.createProgram();
    if (!program) throw Error('Renderer unavailable');
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw Error(gl.getProgramInfoLog(program) || 'Renderer link failed');
    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const paths = [
      '/images/signal-metal.webp',
      '/images/research-instruments.png',
    ];
    const images = await Promise.all(
      paths.map(async (path) => {
        const image = new Image();
        image.src = path;
        await image.decode();
        return image;
      }),
    );
    if (gl.isContextLost()) throw Error('Renderer context lost');
    const names = ['u_metal', 'u_instruments'];
    images.forEach((image, index) => {
      const texture = gl.createTexture();
      if (!texture) throw Error('Texture unavailable');
      textures.push(texture);
      gl.activeTexture(gl.TEXTURE0 + index);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      gl.uniform1i(gl.getUniformLocation(program!, names[index]), index);
    });
    gl.uniform1f(
      gl.getUniformLocation(program, 'u_imageAspect'),
      images[0].naturalWidth / images[0].naturalHeight,
    );
    const progressUniform = gl.getUniformLocation(program, 'u_progress');
    const sizeUniform = gl.getUniformLocation(program, 'u_size');
    const cropUniform = gl.getUniformLocation(program, 'u_cropX');
    return {
      draw(progress) {
        gl.uniform1f(progressUniform, progress);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      },
      resize(width, height) {
        const density = Math.min(
          devicePixelRatio || 1,
          1.5,
          1920 / Math.max(width, height),
        );
        const w = Math.max(1, Math.round(width * density)),
          h = Math.max(1, Math.round(height * density));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        gl.viewport(0, 0, w, h);
        gl.uniform2f(sizeUniform, w, h);
        gl.uniform1f(cropUniform, width <= 767 ? 0.66 : 0.5);
      },
      dispose,
    };
  } catch (error) {
    console.warn('Signal artwork is using its static image fallback.', error);
    dispose();
    return null;
  }
}
