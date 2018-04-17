(() => {
  var api = 'http://artik.me/spectrometer/api/'; // './api/'
  var app = {
    el: {
      video: document.querySelector('#video'),
      canvas: document.querySelector('#canvas'),
      btnTake: document.querySelector('#take'),
      btnCrop: document.querySelector('#crop'),
      btnSave: document.querySelector('#save'),
      btnCancel: document.querySelector('#cancel'),
      form: document.querySelector('#form'),
      formObject: document.querySelector('#object'),
      formDescr: document.querySelector('#descr'),
      snackbar: document.querySelector('#snackbar'),
      listSpecters: document.querySelector('#list'),
    },
    specters: [],
    mediaSource: new MediaSource(),
    sourceBuffer: null,
    cropper: null,
    message: {
      imageBase64: null,
      json: [],
      position: {
        lat: null,
        lon: null
      }
    },
    renderSpecters: () => {
      app.el.listSpecters.innerHTML = "";
      app.specters.forEach((item) => {
        var li = document.createElement('li');
        li.classList.add('specters-list-item');
        var content = document.createElement('div');
        content.classList.add('specters-list-item-content');
        var canvas = document.createElement('canvas');
        var ar = JSON.parse(item.json);
        canvas.width = ar.length;
        canvas.height = 1;
        var ctx = canvas.getContext('2d');
        for (var i = 0; i < canvas.width; i++) {
          var imageData = ctx.createImageData(1, 1);
          imageData.data[0] = Math.floor(ar[i].r * 255);
          imageData.data[1] = Math.floor(ar[i].g * 255);
          imageData.data[2] = Math.floor(ar[i].b * 255);
          imageData.data[3] = 255;
          ctx.putImageData(imageData, i, 0);
        }
        var title = document.createElement('h4');
        title.innerText = item.object;
        var descr = document.createElement('p');
        descr.innerText = item.description;
        var time = document.createElement('span');
        time.classList.add('time');
        time.innerText = item.time;
        setTimeout(() => {
          if (item.lat && item.lon && app.googleMap) {
            new google.maps.Marker({
              position: { lat: item.lat, lng: item.lon },
              map: app.googleMap,
              title: item.object,
              // label: item.object
            });
          }
        }, 3000)
        content.appendChild(canvas);
        content.appendChild(title);
        content.appendChild(descr);
        content.appendChild(time);
        li.appendChild(content);
        app.el.listSpecters.appendChild(li);
      });

    },
    specterCallback: (resp) => {
      if (!Array.isArray(resp)) {
        resp = [resp];
      }
      app.specters = resp.map(item => {
        item.id = parseInt(item.id);
        item.author_id = parseInt(item.author_id);
        item.lat = parseFloat(item.lat);
        item.lon = parseFloat(item.lon);
        // item.time = new Date(item.time);
        return item;
      });
    },
    save: () => {
      // send message
      let send = () => {
        $.ajax({
          type: "POST",
          url: api,
          data: {
            method: 'set-specter',
            image: app.message.imageBase64,
            json: JSON.stringify(app.message.json),
            // TODO: real author id
            author: 1,
            lat: app.message.position.lat,
            lon: app.message.position.lon,
            object: object,
            description: descr
          }
        }).done((resp) => {
          console.log(resp);
          app.specterCallback(resp);
          app.renderSpecters();
        }).fail((e) => {
          console.warn(e);
        });

        app.cancel();
      }

      // check title and description
      var object = app.el.formObject.value,
        descr = app.el.formDescr.value;
      if (!object.length) {
        app.el.snackbar.MaterialSnackbar.showSnackbar({
          message: 'Please describe the subject of the survey',
          timeout: 5000
        });
        setTimeout(() => { app.el.formObject.focus() }, 100);
        return;
      }
      // check geolocation

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          app.message.position.lat = position.coords.latitude;
          app.message.position.lon = position.coords.longitude
          send();
        });
      } else {
        send();
      }

    },
    cancel: () => {
      if (app.cropper) {
        app.cropper.destroy();
      }
      app.el.video.classList.remove('hidden');
      app.el.canvas.classList.add('hidden');
      app.el.btnSave.classList.add('hidden');
      app.el.btnTake.classList.remove('hidden');
      app.el.btnCancel.classList.add('hidden');
      app.el.btnCrop.classList.add('hidden');
      app.el.form.classList.add('hidden');
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
      app.message.imageBase64 = canvas.toDataURL();
      app.message.json = [];
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
        var h = i;
        ctx2.putImageData(imageData, h, 0);
        app.message.json.push({
          average: parseInt((imageData.data[0] + imageData.data[1] + imageData.data[2]) / 3),
          r: (imageData.data[0] / 255).toFixed(2),
          g: (imageData.data[1] / 255).toFixed(2),
          b: (imageData.data[2] / 255).toFixed(2),
          pixel: h
        });
      }

      ctx2.putImageData(imageData, 0, 0)

      app.cropper.destroy();
      app.cropper = null;
      app.el.canvas.classList.remove('hidden');
      app.el.btnCrop.classList.add('hidden');
      app.el.btnSave.classList.remove('hidden');
      app.el.form.classList.remove('hidden');
    },
    takePicture: () => {
      // take picture
      var ctx = app.el.canvas.getContext('2d');
      app.el.canvas.width = app.el.video.videoWidth;
      app.el.canvas.height = app.el.video.videoHeight;
      ctx.drawImage(app.el.video, 0, 0, app.el.canvas.width, app.el.canvas.height);
      // get specter position
      app.cropper = new Cropper(app.el.canvas, {
        scalable: false,
        zoomable: false,
        viewMode: 3
      });
      app.el.video.classList.add('hidden');
      app.el.btnTake.classList.add('hidden');
      app.el.btnCrop.classList.remove('hidden');
      app.el.btnCancel.classList.remove('hidden');
    },
    videoInit: () => {
      app.mediaSource.addEventListener('sourceopen', (event) => {
        app.sourceBuffer = app.mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
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
          window.stream = stream;
          app.el.video.srcObject = stream;
        })
        .catch(error => {
          console.warn('navigator.getUserMedia error: ', error);
        });
    },
    googleMap: null,
    map: () => {
      setTimeout(() => {
        app.googleMap = new google.maps.Map(document.getElementById('gmap'), {
          center: { lat: 0, lng: 0 },
          zoom: 2,
          mapTypeControl: false,
          scrollwheel: false
        });
      }, 500);
    },
    loadSpecters: () => {
      $.ajax({
        type: "POST",
        url: api,
        data: {
          method: 'get-specter',
        }
      }).done((resp) => {
        app.specterCallback(resp);
        app.renderSpecters();
        console.log(app.specters);
      }).fail((e) => {
        console.warn(e);
      });
    },
    init: () => {
      app.map();
      app.videoInit();
      app.loadSpecters();

      app.el.btnTake.addEventListener('click', app.takePicture)
      app.el.btnCrop.addEventListener('click', app.crop)
      app.el.btnSave.addEventListener('click', app.save)
      app.el.btnCancel.addEventListener('click', app.cancel)
    }
  }
  app.init();
})()
