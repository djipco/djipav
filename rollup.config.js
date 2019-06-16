import { terser } from "rollup-plugin-terser";
import resolve from "rollup-plugin-node-resolve";

export default {
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
