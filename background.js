async function setLocalStorageObjectItem(key, value) {
  //console.log(['p_setLocalStorageObjectItem', key, value])

  if (value === undefined) {
    await chrome.storage.local.remove(key);
  } else {
    await chrome.storage.local.set({[key]: JSON.stringify(value)});
  }
}


async function getLocalStorageObjectItem(key) {
  let val = await chrome.storage.local.get(key);
  //console.log(['p_getLocalStorageObjectItem', key, val[key]])
  try {
    return JSON.parse(val[key])
  } catch(e) {
    return undefined;
  }
}


async function updateIcon() {
  var canvas = document.createElement('canvas'); // Create the canvas
  canvas.width = 64;
  canvas.height = 64;

  var selectedProxy = await getLocalStorageObjectItem('selectedProxy');
  selectedProxy = selectedProxy ? selectedProxy.full : false;
  selectedProxy = selectedProxy ? true : false;


  var context = canvas.getContext('2d');
  if(selectedProxy) {
    context.fillStyle = "#44df49";
  } else {
    context.fillStyle = "#999898"; //#44df49
  }
  context.fillRect(0, 0, 16, 16);

  if(selectedProxy) {
    context.fillStyle = "#693ed1";
  } else {
    context.fillStyle = "#1a1a1a";
  }
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "14px Sans";
  context.fillText("S", 8, 10);

  chrome.action.setIcon({
    imageData: context.getImageData(0, 0, 16, 16)
  });
}

chrome.runtime.onStartup.addListener(function() {
  updateIcon();
});

chrome.webRequest.onAuthRequired.addListener(async function(details, cb) {
  var idstr = details.requestId.toString();
  //console.log('AUTH1 - ' + details.requestI, details);
	if(details.isProxy !== true){
    return cb({})
  }
  /*
  if(!(idstr in calls)){
    calls[idstr] = 0;
  }
  calls[idstr] = calls[idstr] + 1;

  var retry = 5;
  if(calls[idstr] >= retry){
    chrome.notifications.create('1', {
      'type': 'basic',
      'iconUrl': 'icon_locked_128.png',
      'title': 'Proxy Auto Auth error',
      'message': 'A lot of Proxy Authentication requests have been detected. There is probably a mistake in your credentials. For your safety, the extension has been temporary locked. To unlock it, click the save button in the options.',
      'isClickable': true,
      'priority': 2
    }, function(id){
      //console.log('notification callback');
    });
    calls = {};
    return({
      cancel : true
    });
  }
  */

  var selectedProxy = await getLocalStorageObjectItem('selectedProxy');
  //console.log(selectedProxy)
  if(!selectedProxy) {
    return cb({
      cancel : true
    });
  }

  //console.log(selectedProxy);


  var login = selectedProxy.user;
  var password = selectedProxy.password;
  //console.log(['lp', login,password])
  if (login && password){
    return cb({
      authCredentials : {
        'username' : login,
        'password' : password
      }
    });
  }
  return cb({})
}, {urls: ["<all_urls>"]}, ["asyncBlocking"]);
