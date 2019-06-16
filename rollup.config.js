import babel from "rollup-plugin-babel";
import { terser } from "rollup-plugin-terser";
import resolve from "rollup-plugin-node-resolve";

// Global scope namespace (djipevents) for browsers
const iife = {
  input: "src/djipav.js",
  output: {
    format: "iife",
    file: "dist/djipav.iife.min.js",
    exports: "named",
    name: "djipav"
  },
  plugins: [
    babel(),
    resolve(),
    terser()
  ]
};

// ES6 module for modern browsers
const esm = {
  input: "src/djipav.js",
  output: {
    format: "es",
    file: "dist/djipav.esm.min.js"
  },
  plugins: [
    resolve(),
    terser()
  ]
};

// Pick the right one to export according to environment variable
let config;

if (process.env.BABEL_ENV === "iife") {
  config = iife;
} else {
  config = esm;
}

export default config;
