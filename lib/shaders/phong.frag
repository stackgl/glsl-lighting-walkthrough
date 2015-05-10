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
#pragma glslify: attenuation = require('./attenuation')

const vec2 UV_SCALE = vec2(8.0, 1.0);
const float shininess = 1.0;
const float roughness = 0.9;
const float albedo = 0.95;

uniform sampler2D texDiffuse;
uniform sampler2D texNormal;
uniform sampler2D texSpecular;

uniform int flatShading;
uniform mat4 model;
uniform mat4 view;

uniform Light light;

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

  //now sample from our repeating texture
  vec2 uv = vUv * UV_SCALE;
  vec3 diffuseColor = texture2D(texDiffuse, uv).rgb;
  vec3 normalMap = texture2D(texNormal, uv).rgb * 2.0 - 1.0;
  float specularStrength = texture2D(texSpecular, uv).r;
  
  //our normal map has an inverted green channel
  normalMap.y *= -1.0;

  vec3 L = normalize(lightVector);              //light direction
  vec3 V = normalize(vViewPosition);            //eye direction
  vec3 N = perturb(normalMap, normal, -V, vUv); //surface normal

  //compute our diffuse & specular terms
  float specular = specularStrength * computeSpecular(L, V, N, shininess);
  vec3 diffuse = light.color * computeDiffuse(L, V, N, roughness, albedo) * falloff;
  vec3 ambient = light.ambient;

  //add the lighting
  color += diffuseColor * (diffuse + ambient) + specular;
  gl_FragColor = vec4(color, 1.0);
}