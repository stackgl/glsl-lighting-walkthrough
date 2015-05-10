# glsl-lighting-walkthrough

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

![screen shot](http://i.imgur.com/90BB2q9.jpg)

**This is currently a work in progress.**

You can see the demo here:

http://stack.gl/glsl-lighting-walkthrough/index.html

#### topics

This will cover some lower level aspects of WebGL and GLSL, including:

- drawing meshes with `gl-geometry` and `gl-shader`
- setting up your own camera and model matrices
- per-pixel lighting with glslify
  - using `struct` in GLSL
  - using `glsl-face-normal` for flat shading
  - using `glsl-inverse` and `glsl-transpose` for smooth shading
  - using `glsl-perturb-normal` for normal mapping
  - using `glsl-diffuse-oren-nayar` for rough shading
  - using `glsl-specular-blinn-phong` for specular term
  - attenuation for point lights at a distance

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

## License

MIT. See [LICENSE.md](http://github.com/stackgl/glsl-lighting-walkthrough/blob/master/LICENSE.md) for details.
