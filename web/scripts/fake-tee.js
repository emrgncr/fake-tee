

/**
 *
 * @param {string} base_img_src
 * @param {string} uv_img_src
 * @param {string} fake_tee_src
 * @param {HTMLElement} parentdiv
 */
function generateFakeImage(base_img_src, uv_img_src, fake_tee_src, parentdiv) {
  const size = 1024;
  let base_canvas = document.createElement("canvas");
  base_canvas.style.display = "none";
  base_canvas.width = size;
  base_canvas.height = size;
  document.body.appendChild(base_canvas);

  let uv_canvas = document.createElement("canvas");
    uv_canvas.style.display = "none";
  uv_canvas.width = size;
  uv_canvas.height = size;
  document.body.appendChild(uv_canvas);

  let fake_tee_canvas = document.createElement("canvas");
    fake_tee_canvas.style.display = "none";
  fake_tee_canvas.width = size;
  fake_tee_canvas.height = size;
  document.body.appendChild(fake_tee_canvas);

  let out_canvas = document.createElement("canvas");
    out_canvas.style.display = "none";
  out_canvas.width = size;
  out_canvas.height = size;
  document.body.appendChild(out_canvas);

  let base_ctx = base_canvas.getContext("2d");
  let uv_ctx = uv_canvas.getContext("2d");
  let fake_tee_ctx = fake_tee_canvas.getContext("2d");
  let out_ctx = out_canvas.getContext("2d");

  let base_img = new Image();
  base_img.crossOrigin = "Anonymous";
  base_img.src = base_img_src;

  let uv_img = new Image();
  uv_img.crossOrigin = "Anonymous";
  uv_img.src = uv_img_src;

  let fake_tee_img = new Image();
  fake_tee_img.crossOrigin = "Anonymous";
  fake_tee_img.src = fake_tee_src;

  base_img.onerror = function () {
    console.error("Error loading base image:", base_img_src);
  };
  uv_img.onerror = function () {
    console.error("Error loading UV image:", uv_img_src);
  };
  fake_tee_img.onerror = function () {
    console.error("Error loading fake tee image:", fake_tee_src);
  };

  Promise.all([
    new Promise((resolve) => {
      base_img.onload = resolve;
    }),
    new Promise((resolve) => {
      uv_img.onload = resolve;
    }),
    new Promise((resolve) => {
      fake_tee_img.onload = resolve;
    }),
  ]).then(() => {
    base_ctx.drawImage(base_img, 0, 0, base_canvas.width, base_canvas.height);
    uv_ctx.drawImage(uv_img, 0, 0, uv_canvas.width, uv_canvas.height);
    fake_tee_ctx.drawImage(
      fake_tee_img,
      0,
      0,
      fake_tee_canvas.width,
      fake_tee_canvas.height
    );

    let base_data = base_ctx.getImageData(
      0,
      0,
      base_canvas.width,
      base_canvas.height
    );
    let uv_data = uv_ctx.getImageData(0, 0, uv_canvas.width, uv_canvas.height);
    let fake_tee_data = fake_tee_ctx.getImageData(
      0,
      0,
      fake_tee_canvas.width,
      fake_tee_canvas.height
    );

    // for (let i = 0; i < uv_data.data.length; i += 4) {
    //     let x = i / 4 % uv_canvas.width;
    //     let y = Math.floor(i / 4 / uv_canvas.width);
    //     uv_data.data[i] = (x / uv_canvas.width) * 255;
    //     uv_data.data[i + 1] = (y / uv_canvas.height) * 255;
    //     uv_data.data[i + 2] = 0;
    //     uv_data.data[i + 3] = 255;
    // }

    // first generate the mapped image
    let uv_data_mapped = new Uint8Array(uv_data.data.length);
    for (let i = 0; i < uv_data.data.length; i += 4) {
      let x = uv_data.data[i] / 255;
      x *= fake_tee_data.width - 1;
      let y = uv_data.data[i + 1] / 255;
      y = 1 - y;
      y *= fake_tee_data.height - 1;
      x = Math.floor(x);
      y = Math.floor(y);
      let index = (y * fake_tee_data.width + x) * 4;
      uv_data_mapped[i] = fake_tee_data.data[index];
      uv_data_mapped[i + 1] = fake_tee_data.data[index + 1];
      uv_data_mapped[i + 2] = fake_tee_data.data[index + 2];
      uv_data_mapped[i + 3] = fake_tee_data.data[index + 3];
    }

    // then multiply the mapped image with the base image

    for (let i = 0; i < base_data.data.length; i += 4) {
      // check if the color is pure white
      if(uv_data.data[i + 3] != 0){
      base_data.data[i] =
        (base_data.data[i] * (uv_data_mapped[i])) / (255);
      base_data.data[i + 1] =
        (base_data.data[i + 1] * (uv_data_mapped[i + 1])) / (255);
      base_data.data[i + 2] =
        (base_data.data[i + 2] * (uv_data_mapped[i + 2])) / (255);}
    }

    // for (let i = 0; i < base_data.data.length; i++) {
    //   base_data.data[i] = uv_data_mapped[i];
    // }

    out_ctx.putImageData(base_data, 0, 0);
    let out_img = out_canvas.toDataURL("image/png");
    let img = new Image();
    img.src = out_img;
    parentdiv.appendChild(img);

    document.body.removeChild(base_canvas);
    document.body.removeChild(uv_canvas);
    document.body.removeChild(fake_tee_canvas);
    document.body.removeChild(out_canvas);

  });
}

function applyFakeTee(){
[...document.getElementsByClassName("fake-shirt")].forEach(el => {
    generateFakeImage(el.getAttribute("base_img"), el.getAttribute("uv_img"), el.getAttribute("texture_img"), el);
})
}
