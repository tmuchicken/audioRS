'use strict';

//audio処理用
window.AudioContext = window.AudioContext || window.webkitAudioContext; 

var micList = document.getElementById("mic_list");
var localStream = null;
var localStream1 = null;
let scene = null;
let peer = null;
let existingCall = null;
var videoContainer = document.getElementById('container');
var localVideo = document.getElementById('local_video');
//シーンの素材設定
let dimensions = { width: 1.5, height: 2.4, depth: 1.3  };
let materials = {left: 'brick-bare', right: 'brick-bare',
                   up: 'brick-bare', down: 'wood-panel',
                front: 'brick-bare', back: 'brick-bare' };



function stopVideo() {
    localVideo.pause();
    location.reload(true);
    if (localVideo.srcObject) {
      localVideo.srcObject = null;
    }
    else {
      localVideo.src = "";
    }
  
    if (localStream) {
     stopStream(localStream);
     localStream = null;
    }
}

function stopStream(stream) {
    if (!stream) {
     console.warn('NO stream');
     return;
    }
      
    var tracks = stream.getTracks();
    if (! tracks) {
     console.warn('NO tracks');
     return;
    }
  
    for (index in tracks) {
     tracks[index].stop();
    } 
}  

 function logStream(msg, stream) {
  console.log(msg + ': id=' + stream.id);

  var audioTracks = stream.getAudioTracks();
  if (audioTracks) {
   console.log('audioTracks.length=' + audioTracks.length);
   for (var i = 0; i < audioTracks.length; i++) {
    var track = audioTracks[i];
    console.log(' track.id=' + track.id);
   }
  }
}

 function clearDeviceList() {
  while(micList.lastChild) {
   micList.removeChild(micList.lastChild);
  }
}

 function addDevice(device) {
  if (device.kind === 'audioinput') {
   var id = device.deviceId;
   var label = device.label || 'microphone'; // label is available for https 
   var option = document.createElement('option');
   option.setAttribute('value', id);
   option.innerHTML = label + '(' + id + ')';;
   micList.appendChild(option);
  }
  else if (device.kind === 'audiooutput') {
    var id = device.deviceId;
    var label = device.label || 'speaker'; // label is available for https 
 
    var option = document.createElement('option');
    option.setAttribute('value', id);
    option.innerHTML = label + '(' + id + ')'; 
   }

  else {
   console.error('UNKNOWN Device kind:' + device.kind);
  }
 }


 function getDeviceList() {
  clearDeviceList();
  navigator.mediaDevices.enumerateDevices()
  .then(function(devices) {
   devices.forEach(function(device) {
    console.log(device.kind + ": " + device.label +
                " id = " + device.deviceId);
    addDevice(device);
   });
  })
  .catch(function(err) {
   console.error('enumerateDevide ERROR:', err);
  });
 }

 function getSelectedAudio() {
  var id = micList.options[micList.selectedIndex].value;
  return id;
 }

 function startSelectedAudioStereo() {
  var audioId = getSelectedAudio();
  console.log('selected audio=' + audioId);
  var constraints = {
    audio: {
     deviceId: audioId,
    /*//Google用
     googEchoCancellation:false,
     googAutoGainControl: false,
     googNoiseSuppression: true,
    */
     //FireFox用
     echoCancellation:false,
     //autoGainControl:false,
     //noiseSuppression:true,
    }
    };

  console.log('mediaDevice.getMedia() constraints:', constraints);

  navigator.mediaDevices.getUserMedia(
    constraints
   ).then(function(stream) {
     console.log('1streamきてる');
     logStream('selectedVideo', stream);
         //AudioContextを作成
         var context1  = new AudioContext();
         //sourceの作成
         var source1 = context1.createMediaStreamSource(stream);
         
         //シーンの作成
         scene = new ResonanceAudio(context1, {
            ambisonicOrder: 1,
          });
         scene.setRoomProperties(dimensions,
            materials);
         scene.setListenerPosition(0,0,0); //(x,y,z)
         
         //Rsourceの作成
         var Rsource = scene.createSource();
         Rsource.setPosition(10,0,0); //(x,y,z)
         source1.connect(Rsource.input);


         //peer1の作成
         var peer1 = context1.createMediaStreamDestination();
         scene.output.connect(peer1); //ココの先頭変えるよ
         localStream1 = peer1.stream;
 
     logStream('selectedVideo', stream);
   }).catch(function(err){
    console.error('getUserMedia Err:', err);
   });
 };

 function startSelectedVideoAudio() {
    var audioId = getSelectedAudio();
    console.log('selected audio=' + audioId);
    var constraints = {
      audio: {
       deviceId: audioId,
      /*//Google用
       googEchoCancellation:false,
       googAutoGainControl: false,
       googNoiseSuppression: true,
      */
       //FireFox用
       echoCancellation:false,
       autoGainControl:false,
       noiseSuppression:true,
      }
      };
  
    console.log('mediaDevice.getMedia() constraints:', constraints);
  
    navigator.mediaDevices.getUserMedia(
   constraints
  ).then(function(stream) {
    console.log('1streamきてる');
    logStream('selectedVideo', stream);
    //localVideo.srcObject = stream;
        //AudioContextを作成
        var context1  = new AudioContext();
        //sourceの作成
        var source1 = context1.createMediaStreamSource(stream);
        //panner の作成
        var panner1 = context1.createPanner();
        source1.connect(panner1);
        //peer1の作成
        var peer1 = context1.createMediaStreamDestination();
        //StereoPannner作成
        var StereoPanner = context1.createStereoPanner();
        panner1.connect(StereoPanner);
        StereoPanner.pan.value = sound;

        StereoPanner.connect(peer1); //ココの先頭変えるよ
        localStream1 = peer1.stream;

    logStream('selectedVideo', stream);
  }).catch(function(err){
   console.error('getUserMedia Err:', err);
  });
   };

 navigator.mediaDevices.ondevicechange = function (evt) {
  console.log('mediaDevices.ondevicechange() evt:', evt);
 };


//peeridを取得
function getpeerid(id) {
    //ボタンをすべて消す　PeerIDがサーバーに残ってしまい初期化ができない
    $('#peerid-ui').hide();

    //peerオブジェクトの作成
    peer = new Peer(id,{
        key: '9373b614-604f-4fd5-b96a-919b20a7c24e',    //APIkey
        debug: 3
    });

    start();//イベント確認
}
///////////////////////


function quick(){
    startSelectedAudioStereo();
    getpeerid("ALR1");
    $('#callto-id').val("ln1");
    $('#make-call').submit(function(e){
        e.preventDefault();
        const call = peer.call($('#callto-id').val(), localStream1); 
        setupCallEventHandlers(call);
        });
    };
    
//オーディオシステムの選択
$('#start_video_button_L').click(function () {
    startSelectedVideoAudio();
});

$('#start_video_button_R').click(function () {
    startSelectedVideoAudio();
});

$('#start_video_button_W').click(function () {
    startSelectedAudioStereo();
});


//peeridの選択
$('#AudioLR1').click(function () {
    getpeerid("ALR1");
    $('#callto-id').val("ln1");
});

$('#AudioLR2').click(function () {
    getpeerid("ALR2");
    $('#callto-id').val("ln2");
});

$('#AudioL1').click(function () {
    getpeerid("AL1");
    $('#callto-id').val("AUL1");
});

$('#AudioL2').click(function () {
    getpeerid("AL2");
    $('#callto-id').val("AUL2");
});

$('#AudioR1').click(function () {
    getpeerid("AR1");
    $('#callto-id').val("AUR1");
});

$('#AudioR1').click(function () {
    getpeerid("AR2");
    $('#callto-id').val("AUR2");
});

$('#AudioUserL1').click(function () {
    getpeerid("AUL1");
    $('#callto-id').val("AL1");
    isReceive = true;
});

$('#AudioUserL2').click(function () {
    getpeerid("AUL2");
    $('#callto-id').val("AL2");
    isReceive = true;
});

$('#AudioUserR1').click(function () {
    getpeerid("AUR1");
    $('#callto-id').val("AR1");
    isReceive = true;
});

$('#AudioUserR2').click(function () {
    getpeerid("AUR2");
    $('#callto-id').val("AR2");
    isReceive = true;
});


$('#random').click(function () {
    getpeerid(null);
});


//イベント id取得後じゃないと動作しない
function start() {
    //openイベント
    peer.on('open', function () {
        $('#my-id').text(peer.id);
    });

    //errorイベント
    peer.on('error', function (err) {
        alert(err.message);
        setupMakeCallUI();
    });

    //closeイベント
    peer.on('close', function () {
        alert(err.message);
        setupMakeCallUI();
    });

    //disconnectedイベント
    peer.on('disconnected', function () {
        alert(err.message);
        setupMakeCallUI();
    });

    //着信処理
    peer.on('call', function(call){
        call.answer(localStream1);
        setupCallEventHandlers(call);
    });
}


///////////////発信処理・切断処理・着信処理
$('#make-call').submit(function(e){
    e.preventDefault();
    const call = peer.call($('#callto-id').val(), localStream1); 
    setupCallEventHandlers(call);
    });

$('#end-call').click(function(){
    existingCall.close();
});


/////////////////////


//////////Callオブジェクトに必要なイベント
function setupCallEventHandlers(call){
    if (existingCall) {
        existingCall.close();
    };

    existingCall = call;

    
    setupEndCallUI(call);

    call.on('stream', function(stream){
        addVideo(call,stream);
        setupEndCallUI();
        $('#their-id').text(call.remoteId);
    });
    call.on('close', function(){
        removeVideo(call.remoteId);
        setupMakeCallUI();
    });
}
//////////////////////////////////


///////////video要素の再生・削除・ボタン表示
function addVideo(call,stream){
    $('#their-video').get(0).srcObject = stream;
}

function removeVideo(peerId){
    $('#'+peerId).remove();
}

function setupMakeCallUI(){
    $('#make-call').show();
    $('#end-call').hide();
}


function setupEndCallUI() {
    $('#make-call').hide();
    $('#end-call').show();
    //$('#their-id').text(call.remoteId);
}
//////////////////////////////////////










/*
https://resonance-audio.github.io/resonance-audio/develop/web/getting-started.html
*/
/*
// Create a (first-order Ambisonic) Resonance Audio scene and pass it
// the AudioContext.
let resonanceAudioScene = new ResonanceAudio(audioContext);

// Connect the scene’s binaural output to stereo out.
resonanceAudioScene.output.connect(audioContext.destination);

// Define room dimensions.
// By default, room dimensions are undefined (0m x 0m x 0m).
let roomDimensions = {
  width: 3.1,
  height: 2.5,
  depth: 3.4,
};


// Define materials for each of the room’s six surfaces.
// Room materials have different acoustic reflectivity.
let roomMaterials = {
  // Room wall materials
  left: 'brick-bare',
  right: 'curtain-heavy',
  front: 'marble',
  back: 'glass-thin',
  // Room floor
  down: 'grass',
  // Room ceiling
  up: 'transparent',
};

// Add the room definition to the scene.
resonanceAudioScene.setRoomProperties(roomDimensions, roomMaterials);

// Create an AudioElement.
let audioElement = document.createElement('audio');

// Load an audio file into the AudioElement.
audioElement.src = 'SpeechSample.wav';

// Generate a MediaElementSource from the AudioElement.
let audioElementSource = audioContext.createMediaElementSource(audioElement);

// Add the MediaElementSource to the scene as an audio input source.
let source = resonanceAudioScene.createSource();
audioElementSource.connect(source.input);

// Set the source position relative to the room center (source default position).
source.setPosition(-0.707, -0.707, 0);

// Play the audio.
audioElement.play();

};

var btn = document.getElementById('btn');
btn.onclick(function () {
  Play();
});

*/

/*
 * main.js
 http://phiary.me/webaudio-api-getting-started/
 更新日時:2019/1/15/18:05
 */

/*
var context;
let resonanceAudioScene;

window.AudioContext = window.AudioContext || window.webkitAudioContext;  
var context = new AudioContext();


// Audio 用の buffer を読み込む
var getAudioBuffer = function(url, fn) {  
  var req = new XMLHttpRequest();
  // array buffer を指定
  req.responseType = 'arraybuffer';

  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      if (req.status === 0 || req.status === 200) {
        // array buffer を audio buffer に変換
        context.decodeAudioData(req.response, function(buffer) {
          // コールバックを実行
          fn(buffer);
        });
      }
    }
  };

  req.open('GET', url, true);
  req.send('');
};

// サウンドを再生
var playSound = function(buffer) {
  /* 
  //sourceの都合上コメントアウト
  // source を作成
  var source = context.createBufferSource();
  */

  // Resonance ソースの作成
  //let source = resonanceAudioScene.createSource();


/////////////////////////////////////////////
///////  Resonance Audio Set up  ////////////
/////////////////////////////////////////////

/*
  // Create a (first-order Ambisonic) Resonance Audio scene and pass it
  // オーディオシーンの作成
  let resonanceAudioScene = new ResonanceAudio(context, {
      ambisonicOrder: 1,
    });


      //シーンに部屋を追加する
  // Define room dimensions.
  // By default, room dimensions are undefined (0m x 0m x 0m). メートルで決められる
  let roomDimensions = {
    width: 3.1,
    height: 2.5,
    depth: 3.4,
  };

  // Define materials for each of the room’s six surfaces.
  // Room materials have different acoustic reflectivity. 
  // 部屋の6つの面（4つの壁、天井、および床）それぞれに部屋の材料を定義します。
  let roomMaterials = {
    // Room wall materials
    left: 'brick-bare',
    right: 'curtain-heavy',
    front: 'marble',
    back: 'glass-thin',
    // Room floor
    down: 'grass',
    // Room ceiling
    up: 'transparent',
  };


  // Add the room definition to the scene.
  // シーンに部屋の定義を追加する
  resonanceAudioScene.setRoomProperties(roomDimensions, roomMaterials);




  /////////////////////////////////////////////
  /////////////////////////////////////////////

  // buffer をセット
  resonanceAudioScene.buffer = buffer;
  // context に connect
  resonanceAudioScene.connect(context.destination);
  
  // Set the source position relative to the room center (source default position).
  // ソースをシーンに配置する
  resonanceAudioScene.setPosition(-0.707, -0.707, 0);
  
  // 再生
  resonanceAudioScene.start(0);
};

// main
window.onload = function() {
  // サウンドを読み込む
  //getAudioBuffer('se.mp3', function(buffer) {
    //getAudioBuffer('Overture.mp3', function(buffer) {
    getAudioBuffer('0.1s_20.mp3', function(buffer) {
    // 読み込み完了後にボタンにクリックイベントを登録
    var btn = document.getElementById('btn');
    btn.onclick = function() {
      // サウンドを再生
      playSound(buffer);
    };
  });
};
*/