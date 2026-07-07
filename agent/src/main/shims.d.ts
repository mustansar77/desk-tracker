declare module "screenshot-desktop" {
  interface Options {
    format?: "png" | "jpg";
    screen?: string;
  }
  function screenshot(options?: Options): Promise<Buffer>;
  export = screenshot;
}
