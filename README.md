## glsl-lighting-walkthrough

[![final](http://i.imgur.com/9kQcKBP.png)](http://stack.gl/glsl-lighting-walkthrough/)

[(live demo)](http://stack.gl/glsl-lighting-walkthrough/)

This article provides an overview of the various steps involved in lighting a mesh with a custom GLSL shader. Some of the features of the demo:

- per-pixel lighting
- flat & smooth normals
- gamma correction for working in linear space
- normal & specular maps for detail
- attenuation for point light falloff
- Oren-Nayar diffuse for rough surfaces
- phong reflectance model for specular highlights

It is not intended as a full-blown beginner's guide, and assumes prior knowledge of WebGL and stackgl rendering. Although it is implemented with stackgl, the same concepts and shader code could be used in ThreeJS and other frameworks.

If you have questions, comments or improvements, please [post a new issue](https://github.com/stackgl/glsl-lighting-walkthrough/issues).

## contents

- [running from source](#running-from-source)
- [code overview](#code-overview)
- [shaders](#shaders)
- [phong](#phong)
  - [standard derivatives](#standard-derivatives)
  - [vertex shader](#vertex-shader)
  - [flat normals](#flat-normals)
  - [smooth normals](#smooth-normals)
  - [gamma correction](#gamma-correction)
  - [normal mapping](#normal-mapping)
  - [light attenuation](#light-attenuation)
  - [diffuse](#diffuse)
  - [specular](#specular)
  - [final color](#final-color)

## running from source

To run from source:

```sh
git clone https://github.com/stackgl/glsl-lighting-walkthrough.git
cd glsl-lighting-walkthrough

npm install
npm run start
```

And then open `http://localhost:9966` to see the demo. Changes to the source will live-reload the browser for development.

To build:

```sh
npm run build
```

## code overview

The code is using Babelify for ES6 template strings, destructuring, and arrow functions. It is organized like so:

- [index.js](index.js) - loads images, then boots up the app
- [lib/app.js](lib/app.js) - sets up a WebGL render loop and draws the scene
- [lib/scene.js](lib/scene.js) - sets up textures, positions the light and draws meshes
- [lib/create-sphere.js](lib/create-sphere.js) - create a 3D sphere for the light source
- [lib/create-torus.js](lib/create-torus.js) - creates a 3D torus with a phong shader

## shaders

[glslify](https://github.com/stackgl/glslify) is used to modularize the shaders and pull some common functions from [npm](https://www.npmjs.com/).

We use a "basic" material for our light indicator, so that it appears at a constant color regardless of depth and lighting:

- [shaders/basic.frag](lib/shaders/basic.frag)
- [shaders/basic.vert](lib/shaders/basic.vert)

We use a "phong" material for our torus, which we will explore in more depth below.

- [shaders/phong.frag](lib/shaders/phong.frag)
- [shaders/phong.vert](lib/shaders/phong.vert)

There are many ways to skin a cat; this is just one approach to phong shading. 

## phong

### standard derivatives

Our phong shader uses standard derivatives, so we need to enable the extension before we create it. The JavaScript code looks like this:

```js
//enable the extension
var ext = gl.getExtension('OES_standard_derivatives')
if (!ext)
  throw new Error('derivatives not supported')

var shader = createShader(gl, vert, frag)
...
```

And, in our fragment shader we need to enable it explicitly:

```glsl
#extension GL_OES_standard_derivatives : enable
precision highp float;

void main() {
  ...
}
```

The extension is used in two places in our final shader:

- [glsl-face-normal](https://www.npmjs.com/package/glsl-face-normal) for flat shading (optional)
- [glsl-perturb-normal](https://www.npmjs.com/package/glsl-perturb-normal) for normal-mapping

### vertex shader

![white](http://i.imgur.com/J24k2iu.png)

Our vertex shader needs to pass the texture coordinates and view space position to the fragment shader. 

A basic vertex shader looks like this:

```glsl
attribute vec4 position;
attribute vec2 uv;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
  //determine view space position
  mat4 modelViewMatrix = view * model;
  vec4 viewModelPosition = modelViewMatrix * position;
  
  //pass varyings to fragment shader
  vViewPosition = viewModelPosition.xyz;
  vUv = uv;

  //determine final 3D position
  gl_Position = projection * viewModelPosition;
}
```

### flat normals

![flat](http://i.imgur.com/YvuhBGk.png)

If you want flat shading, you don't need to submit normals as a vertex attribute. Instead, you can use [glsl-face-normal](https://www.npmjs.com/package/glsl-face-normal) to estimate them in the fragment shader:

```glsl
#pragma glslify: faceNormals = require('glsl-face-normal')

varying vec3 vViewPosition;

void main() {
  vec3 normal = faceNormals(vViewPosition);
  gl_FragColor = vec4(normal, 1.0);
}
```

### smooth normals

![smooth](http://i.imgur.com/hnYlRG5.png)

For smooth normals, we use the object space normals from [torus-mesh](https://www.npmjs.com/package/torus-mesh) and pass them to the fragment shader to have them interpolated between vertices.

To transform the object normals into view space, we multiply them by a "normal matrix" - the inverse transpose of the model view matrix.

Since this doesn't change vertex to vertex, you can do it CPU-side and pass it as a uniform to the vertex shader. 

Or, you can just simply compute the normal matrix in the vertex step. GLSL ES does not provide built-in `transpose()` or `inverse()`, so we need to require them from npm:

- [glsl-inverse](https://www.npmjs.com/package/glsl-inverse)
- [glsl-transpose](https://www.npmjs.com/package/glsl-transpose)

```glsl
//object normals
attribute vec3 normal;
varying vec3 vNormal;

#pragma glslify: transpose = require('glsl-transpose')
#pragma glslify: inverse = require('glsl-inverse')

void main() {
  ...

  // Rotate the object normals by a 3x3 normal matrix.
  mat3 normalMatrix = transpose(inverse(mat3(modelViewMatrix)));
  vNormal = normalize(normalMatrix * normal);
}
```

### gamma correction

When dealing with PNG and JPG textures, it's important to remember that they most likely have gamma correction applied to them already, and so we need to account for it when doing any work in linear space.

We can use `pow(value, 2.2)` and `pow(value, 1.0 / 2.2)` to convert to and from the gamma-corrected space. Or, [glsl-gamma](https://github.com/stackgl/glsl-gamma) can be used for convenience.

```glsl
#pragma glslify: toLinear = require('glsl-gamma/in')
#pragma glslify: toGamma  = require('glsl-gamma/out')

vec4 textureLinear(sampler2D uTex, vec2 uv) {
  return toLinear(texture2D(uTex, uv));
}

void main() {
  //sample sRGB and account for gamma
  vec4 diffuseColor = textureLinear(texDiffuse, uv);

  //operate on RGB in linear space
  ...
  
  //output final color to sRGB space
  color = toGamma(color);
}
```

For details, see [GPU Gems - The Importance of Being Linear](http://http.developer.nvidia.com/GPUGems3/gpugems3_ch24.html).

### normal mapping

![normalmap](http://i.imgur.com/cJce72J.png)

We can use normal maps to add detail to the shading without additional topology.

A normal map typically stores a unit vector `[X,Y,Z]` in an image's `[R,G,B]` channels, respectively. The 0-1 colors are expanded into the -1 to 1 range, representing the unit vector.

```glsl
  // ... fragment shader ...

  //sample texture and expand to -1 .. 1
  vec3 normalMap = textureLinear(texNormal, uv) * 2.0 - 1.0;

  //some normal maps use an inverted green channel
  normalMap.y *= -1.0;

  //determine perturbed surface normal
  vec3 V = normalize(vViewPosition); 
  vec3 N = perturb(normalMap, normal, -V, vUv);
```

### light attenuation

![attenuation](http://i.imgur.com/qZUMbUd.png)

For lighting, we need to determine the vector from the view space surface position to the view space light position. Then we can account for attenuation (falloff based on the distance from light), diffuse, and specular. 

The relevant bits of the fragment shader:

```glsl
uniform mat4 view;

#pragma glslify: attenuation = require('./attenuation')

void main() {
  ...

  //determine surface to light vector
  vec4 lightPosition = view * vec4(light.position, 1.0);
  vec3 lightVector = lightPosition.xyz - vViewPosition;

  //calculate attenuation
  float lightDistance = length(lightVector);
  float falloff = attenuation(light.radius, light.falloff, lightDistance);

  //light direction
  vec3 L = normalize(lightVector);

  ...
}
```

Our chosen [attenuation function](lib/shaders/madams-attenuation.glsl) is by Tom Madams, but there are many others that we could choose from.

```glsl
float attenuation(float r, float f, float d) {
  float denom = d / r + 1.0;
  float attenuation = 1.0 / (denom*denom);
  float t = (attenuation - f) / (1.0 - f);
  return max(t, 0.0);
}
```

### diffuse

![diffuse](http://i.imgur.com/pfqQCN7.png)

With our light direction, surface normal, and view direction, we can start to work on diffuse lighting. The color is multiplied by falloff to create the effect of a distant light.

For rough surfaces, [glsl-diffuse-oren-nayar](https://www.npmjs.com/package/glsl-diffuse-oren-nayar) looks a bit better than [glsl-diffuse-lambert](https://www.npmjs.com/package/glsl-diffuse-lambert). 

```glsl
#pragma glslify: computeDiffuse = require('glsl-diffuse-oren-nayar')

  ...

  //diffuse term
  vec3 diffuse = light.color * computeDiffuse(L, V, N, roughness, albedo) * falloff;
  
  //texture color
  vec3 diffuseColor = textureLinear(texDiffuse, uv).rgb;
```

These shading functions are known as [bidirectional reflectance distribution functions](http://en.wikipedia.org/wiki/Bidirectional_reflectance_distribution_function) (BRDF).

### specular

![specular](http://i.imgur.com/lDimd4U.png)

Similarly, we can apply specular with one of the following BRDFs:

- [glsl-specular-blinn-phong](https://www.npmjs.com/package/glsl-specular-blinn-phong)
- [glsl-specular-phong](https://www.npmjs.com/package/glsl-specular-phong)
- [glsl-specular-ward](https://www.npmjs.com/package/glsl-specular-ward)
- [glsl-specular-gaussian](https://www.npmjs.com/package/glsl-specular-gaussian)
- [glsl-specular-beckmann](https://www.npmjs.com/package/glsl-specular-beckmann)
- [glsl-specular-cook-torrance](https://www.npmjs.com/package/glsl-specular-cook-torrance)

Which one you choose depends on the material and aesthetic you are working with. In our case, `glsl-specular-phong` looks pretty good.

Here we are using a specular map and `specularScale` multiplier to drive the strength. The above screen shot is scaled 100x for demonstration.

```glsl
#pragma glslify: computeSpecular = require('glsl-specular-phong')

  ...
  
  float specularStrength = textureLinear(texSpecular, uv).r;
  float specular = specularStrength * computeSpecular(L, V, N, shininess);
  specular *= specularScale;
```

### final color

![final](http://i.imgur.com/ZN5FmKz.png)

We now calculate the final color in the following manner. 

```glsl
  ...
  //compute final color
  vec3 color = diffuseColor * (diffuse + light.ambient) + specular;
```

Our final color is going straight to the screen, so we should re-apply the gamma correction we removed earlier. If the color was going through a post-processing pipeline, we could continue operating in linear space until the final step. 

```glsl
  ...
  //output color
  gl_FragColor.rgb = toGamma(color);
  gl_FragColor.a   = 1.0;
```

The [final result](http://stack.gl/glsl-lighting-walkthrough/). 

## Further Reading

- [Tom Dalling - Modern OpenGL Series](http://www.tomdalling.com/blog/category/modern-opengl/)
- [GPU Gems - The Importance of Being Linear](http://http.developer.nvidia.com/GPUGems3/gpugems3_ch24.html)
- [Normal Mapping Without Precomputed Tangents](http://www.thetenthplanet.de/archives/1180)

## License

MIT. See [LICENSE.md](http://github.com/stackgl/glsl-lighting-walkthrough/blob/master/LICENSE.md) for details.