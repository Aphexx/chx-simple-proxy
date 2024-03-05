




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



var closePopup = function() {
	//window.close();
};
var parseUrl = function(url) {
	return { scheme: url.substring(0, url.indexOf(":")), host: url.substring(url.lastIndexOf("/") + 1, url.lastIndexOf(":")), port: parseInt(url.substring(url.lastIndexOf(":") + 1)) };
};


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

function url2obj(url) {
  var pattern = /^(?:([^:\/?#\s]+):\/{2})?(?:([^@\/?#\s]+)@)?([^\/?#\s]+)?(?:\/([^?#\s]*))?(?:[?]([^#\s]+))?\S*$/;
  var matches =  url.match(pattern);
  var params = {};
  if (matches[5] != undefined) {
    matches[5].split('&').map(function(x){
      var a = x.split('=');
      params[a[0]]=a[1];
    });
  }

  return {
    protocol: matches[1],
    user: matches[2] != undefined ? matches[2].split(':')[0] : undefined,
    password: matches[2] != undefined ? matches[2].split(':')[1] : undefined,
    host: matches[3],
    hostname: matches[3] != undefined ? matches[3].split(/:(?=\d+$)/)[0] : undefined,
    port: matches[3] != undefined ? matches[3].split(/:(?=\d+$)/)[1] : undefined,
    segments : matches[4] != undefined ? matches[4].split('/') : undefined,
    params: params,
    full: url,
  };
}


let onHistoryLinkClick = function(e) {
  e.preventDefault(e);
  document.getElementById("proxyAddress").value = e.target.text;
  setProxy();
  return false;
}

let onHistoryRemoveClick = async function(e) {
  e.preventDefault(e);
  let val = e.target.parentNode.querySelector('.history-link').text;

  var history = await getLocalStorageObjectItem("history");
  if(!history) history = [];
  while(history.indexOf(val) !== -1) {
    history.splice(history.indexOf(val), 1);
  }
  await setLocalStorageObjectItem('history', history);
  await refreshHistory();
  return false;
}



let refreshHistory = async function () {
  var history = await getLocalStorageObjectItem("history");
  if(!history) history = [];
  let hhtml = '<ul>';
  for(let i of history.reverse()) {
    hhtml += '<li><a href="" class="history-link">' + i + '</a> <a href="" class="history-remove">x</a></li>';
  }
  hhtml += '</ul>';
  document.getElementById("history").innerHTML = hhtml;

  document.querySelectorAll('.history-link').forEach(function(el) {
    el.addEventListener('click', onHistoryLinkClick);
  });
  document.querySelectorAll('.history-remove').forEach(function(el) {
    el.addEventListener('click', onHistoryRemoveClick);
  });

}


async function setProxy() {
  var proxyAddress = document.getElementById("proxyAddress").value;
  let selectedProxy = url2obj(proxyAddress);
  await setLocalStorageObjectItem('selectedProxy', selectedProxy);
  let history = await getLocalStorageObjectItem('history');
  if(!history) {
    history = [];
  }

  if(proxyAddress) {
    try {
      chrome.proxy.settings.set({ value: { mode: "fixed_servers", rules: {
        singleProxy: {
          scheme: selectedProxy.protocol,
          host: selectedProxy.hostname,
          port: parseInt(selectedProxy.port),
        },
        //bypassList: null
      }}, scope: "regular" }, closePopup);
      while(history.indexOf(selectedProxy.full) !== -1) {
        history.splice(history.indexOf(selectedProxy.full), 1);
      }
      history.push(selectedProxy.full);
      await setLocalStorageObjectItem('error', false);
    } catch (e) {
      await setLocalStorageObjectItem('error', e.message) ;
    }
    history = history.slice(-10);
    await setLocalStorageObjectItem('history', history);
  } else {
    await setLocalStorageObjectItem('error', false);
    chrome.proxy.settings.set({ value: { mode: "direct" }, scope: "regular" }, closePopup);
	}
  refreshHistory();
  updateError();
  updateIcon();
}


async function updateError() {
  if(await getLocalStorageObjectItem('error')) {
    document.getElementById("error").innerText = await getLocalStorageObjectItem('error');
  } else {
    document.getElementById("error").innerText = '';
  }
}


document.addEventListener('DOMContentLoaded', async function() {
  var selectedProxy = await getLocalStorageObjectItem('selectedProxy');
  document.getElementById("proxyAddress").value = selectedProxy ? selectedProxy.full : '';

  await refreshHistory();
  await updateError();



  var setButton = document.getElementById('btn_set');
  var clearButton = document.getElementById('btn_clear');
  clearButton.addEventListener('click', function() {
    document.getElementById("proxyAddress").value = '';
    setProxy();
  });
  setButton.addEventListener('click', function() {
    setProxy();
  });
});

