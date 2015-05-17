#extension GL_OES_standard_derivatives : enable
precision highp float;

struct Light {
  vec3 position;
  vec3 color;
  vec3 ambient;
  float falloff;
  float radius;
};

varying vec2 vUv;
varying vec3 vViewPosition;
varying vec3 vNormal;

#pragma glslify: faceNormals = require('glsl-face-normal')
#pragma glslify: perturb = require('glsl-perturb-normal')
#pragma glslify: computeDiffuse = require('glsl-diffuse-oren-nayar')
#pragma glslify: computeSpecular = require('glsl-specular-blinn-phong')
#pragma glslify: attenuation = require('./madams-attenuation')

const vec2 UV_SCALE = vec2(8.0, 1.0);
const float specularScale = 0.4;
const float shininess = 40.0;
const float roughness = 0.9;
const float albedo = 0.95;

uniform sampler2D texDiffuse;
uniform sampler2D texNormal;
uniform sampler2D texSpecular;

uniform int flatShading;
uniform mat4 model;
uniform mat4 view;

uniform Light light;

vec3 sampleLinear(sampler2D tex, vec2 uv) {
  return pow(texture2D(tex, uv).rgb, vec3(2.2));
}

vec3 toGamma(vec3 color) {
  return pow(color, vec3(1.0 / 2.2));
}

void main() {
  vec3 normal = vec3(0.0);
  if (flatShading == 1) {
    normal = faceNormals(vViewPosition);
  } else {
    normal = vNormal;
  }

  //determine surface to light direction
  vec4 lightPosition = view * vec4(light.position, 1.0);
  vec3 lightVector = lightPosition.xyz - vViewPosition;
  vec3 color = vec3(0.0);

  //calculate attenuation
  float lightDistance = length(lightVector);
  float falloff = attenuation(light.radius, light.falloff, lightDistance);

  //now sample from our repeating brick texture
  //assume its in sRGB, so we need to correct for gamma
  vec2 uv = vUv * UV_SCALE;
  vec3 diffuseColor = sampleLinear(texDiffuse, uv);
  vec3 normalMap = sampleLinear(texNormal, uv) * 2.0 - 1.0;
  float specularStrength = sampleLinear(texSpecular, uv).r;
  
  //our normal map has an inverted green channel
  normalMap.y *= -1.0;

  vec3 L = normalize(lightVector);              //light direction
  vec3 V = normalize(vViewPosition);            //eye direction
  vec3 N = perturb(normalMap, normal, -V, vUv); //surface normal

  //compute our diffuse & specular terms
  float specular = specularStrength * computeSpecular(L, V, N, shininess) * specularScale;
  vec3 diffuse = light.color * computeDiffuse(L, V, N, roughness, albedo) * falloff;
  vec3 ambient = light.ambient;

  //add the lighting
  color += diffuseColor * (diffuse + ambient) + specular;

  //re-apply gamma to output buffer
  color.rgb = toGamma(color.rgb);
  gl_FragColor = vec4(vec3(diffuse), 1.0);
}