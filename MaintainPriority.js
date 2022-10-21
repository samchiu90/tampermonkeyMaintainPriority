// ==UserScript==
// @name         MaintainPriority
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Maintain tab Priority by playing WhiteNoise
// @author       samchiu90
// @match        *://*/* 
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Your code here...
  function createWhiteNoise(time, freq = 44100) {
    const length = time * freq;
    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext ||
      window.mozAudioContext;
    if (!AudioContext) {
      console.log("No Audio Context");
    }
    const context = new AudioContext();

    var noiseBuffer = context.createBuffer(1, length, freq),
      output = noiseBuffer.getChannelData(0);

    for (var i = 0; i < length; i++) {
      output[i] = (Math.random() * 2 - 1) / 1;
    }

    for (var j = 0; j < length; j++) {
      output[j] = output[j / 2];
    }
    const blob = bufferToWave(noiseBuffer, length);
    return URL.createObjectURL(blob);
  }

  function bufferToWave(abuffer, len) {
    let numOfChan = abuffer.numberOfChannels,
      length = len * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [],
      i,
      sample,
      offset = 0,
      pos = 0;

    // write WAVE header
    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);

    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);

    setUint32(0x61746164);
    setUint32(length - pos - 4);

    // write interleaved data
    for (i = 0; i < abuffer.numberOfChannels; i++) {
      channels.push(abuffer.getChannelData(i));
    }
    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {
        // interleave channels
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
        view.setInt16(pos, sample, true); // write 16-bit sample
        pos += 2;
      }
      offset++; // next source sample
    }

    // create Blob
    return new Blob([buffer], { type: "audio/wav" });

    function setUint16(data) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  }

  const WhiteNoiseLink = createWhiteNoise(1, 44100);

  function MaintainPriority(active) {
    let WhiteNoise = document.getElementById("WhiteNoise_audio");

    if (active && WhiteNoise) {
      WhiteNoise.load();
      WhiteNoise.play();
      console.log("play WhiteNoise");
    } else {
      if (WhiteNoise) {
        WhiteNoise.pause();
        console.log("pause WhiteNoise");
      }
    }
  }

  window.addEventListener("load", () => {
    let WhiteNoiseNode = document.createElement("audio");
    WhiteNoiseNode.muted = false;
    WhiteNoiseNode.setAttribute("id", "WhiteNoise_audio");
    WhiteNoiseNode.loop = true;

    WhiteNoiseNode.volume = 0.1;
    WhiteNoiseNode.src = WhiteNoiseLink;

    let DivNode = document.createElement("div");
    DivNode.setAttribute("id", "PriorityController_audio");
    DivNode.style = `position: absolute;
    top: 0 ;
    z-index: 1000;
    background-color: white;`;
    let InputNode = document.createElement("input");
    InputNode.type = "checkbox";
    InputNode.setAttribute("id", "Priority_checkbox");
    InputNode.value = false;
    InputNode.style = "color: black;";

    let LabelNode = document.createElement("label");
    LabelNode.setAttribute("for", "Priority_checkbox");
    LabelNode.style = "color: black;";
    LabelNode.innerHTML = "Maintain Priority";

    DivNode.appendChild(InputNode);
    DivNode.appendChild(LabelNode);
    DivNode.appendChild(WhiteNoiseNode);

    let Node = document.body.insertBefore(DivNode, document.body.children[0]);
    document
      .getElementById("Priority_checkbox")
      .addEventListener("change", () => {
        let current = document.getElementById("Priority_checkbox").value;
        document.getElementById("Priority_checkbox").value = current ^ 1;
        MaintainPriority(current ^ 1);
      });
  });

  window.addEventListener("beforeunload", () => {
    MaintainPriority(0);

    document.getElementById("PriorityController_audio").remove();
  });
})();
