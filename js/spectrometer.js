(() => {
  var app = {
    el: {
      video: document.querySelector('#video'),
      canvas: document.querySelector('#canvas'),
      btnTake: document.querySelector('#take'),
      btnCrop: document.querySelector('#crop'),
      btnSave: document.querySelector('#save'),
    },
    mediaSource: new MediaSource(),
    sourceBuffer: null,
    cropper: null,
    save: () => {
      app.el.btnSave.classList.toggle('hidden');
      app.el.video.classList.toggle('hidden');
      app.el.btnTake.classList.toggle('hidden');
      app.el.canvas.classList.toggle('hidden');
    },
    rgbToHsl: (r, g, b) => {
      r /= 255, g /= 255, b /= 255;

      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var h, s, l = (max + min) / 2;

      if (max == min) {
        h = s = 0; // achromatic
      } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
      }

      return { h: h, s: s, l: l };
    },
    crop: () => {
      // new canvas
      var canvas = app.cropper.getCroppedCanvas();
      var ctx = canvas.getContext('2d');
      // app canvas
      var ctx2 = app.el.canvas.getContext('2d');
      app.el.canvas.width = canvas.width; //360;
      app.el.canvas.height = 1;
      ctx2.fillStyle = "black";
      ctx2.fillRect(0, 0, 360, 1);


      for (var i = 0; i < canvas.width; i++) {
        var e = ctx.getImageData(i, canvas.height / 2, 1, 1);
        var imageData = ctx2.createImageData(1, 1);
        imageData.data[0] = e.data[0]
        imageData.data[1] = e.data[1]
        imageData.data[2] = e.data[2]
        imageData.data[3] = e.data[3]
        // var h = parseInt(app.rgbToHsl(e.data[0], e.data[1], e.data[2]).h * 360);
        // ctx2.putImageData(imageData, h, 0);
        ctx2.putImageData(imageData, i, 0);
      }

      ctx2.putImageData(imageData, 0, 0)

      app.el.canvas.classList.toggle('hidden');
      app.cropper.destroy();
      app.cropper = null;
      app.el.btnCrop.classList.toggle('hidden');
      app.el.btnSave.classList.toggle('hidden');
    },
    takePicture: () => {
      // take picture
      var ctx = app.el.canvas.getContext('2d');
      app.el.canvas.width = app.el.video.videoWidth;
      app.el.canvas.height = app.el.video.videoHeight;
      console.log('take...', app.el.canvas)
      ctx.drawImage(app.el.video, 0, 0, app.el.canvas.width, app.el.canvas.height);
      console.log('picture taken')
      // get specter position
      app.cropper = new Cropper(app.el.canvas, {
        scalable: false,
        zoomable: false,
        viewMode: 3
      });
      app.el.video.classList.toggle('hidden');
      app.el.btnTake.classList.toggle('hidden');
      app.el.btnCrop.classList.toggle('hidden');
    },
    videoInit: () => {
      app.mediaSource.addEventListener('sourceopen', (event) => {
        console.log('MediaSource opened');
        app.sourceBuffer = app.mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
        console.log('Source buffer: ', app.sourceBuffer);
      }, false);

      var isSecureOrigin = location.protocol === 'https:' || location.hostname === 'localhost';
      if (!isSecureOrigin) {
        console.warn('getUserMedia() must be run from a secure origin: HTTPS or localhost. \n\nChanging protocol to HTTPS');
        location.protocol = 'HTTPS';
      }

      navigator.mediaDevices
        .getUserMedia({
          // audio: true,
          video: true
        })
        .then(stream => {
          console.log('getUserMedia() got stream: ', stream);
          window.stream = stream;
          app.el.video.srcObject = stream;
        })
        .catch(error => {
          console.log('navigator.getUserMedia error: ', error);
        });
    },
    init: () => {
      app.videoInit();

      app.el.btnTake.addEventListener('click', app.takePicture)
      app.el.btnCrop.addEventListener('click', app.crop)
      app.el.btnSave.addEventListener('click', app.save)
    }
  }
  app.init();
})()
