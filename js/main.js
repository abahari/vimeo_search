// Frontend developer challenge
// Author : Aissam BAHARI 

(function () {
  
  // strict mode to prevent sloppy JS
  'use strict';

  // get DOM selector 
  var DOM = {
    content : document.getElementById('content')
  };

  // cache data respense 
  var cachRespense = {
    res : null
  };

  // application settings
  var settingsApp = {
    url : window.location.href+'data/data.json',
    radiofilter : 10,
    maxItems : 49,
    checklikes : false, 
    query: ''
  };

  // ajax request abstraction
  function ajaxRequest (url) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            success(JSON.parse(xhr.responseText));
        }
    };
    xhr.send();
  }

  // on success
  function success (respense) {
    // cache results
    cachRespense.res = respense.data;

    prepareTemplate ( cachRespense.res, true, 0, settingsApp.radiofilter);
  }


  // render app & provide only items w'll need 
  function render (res, index) {
    var classes = '';
    if (index > 9 ) {
        classes = 'hide';
    }
    return {
        imgSrc : res[index].user.pictures == null ? './img/photo.jpg' : res[index].user.pictures.sizes[1].link,
        authorLink : res[index].user.link,
        videoLink: res[index].link,
        videoName : res[index].name,
        description: res[index].description,
        plays: res[index].stats.plays,
        comments: res[index].metadata.connections.comments.total, 
        likes: res[index].metadata.connections.likes.total,
        classes: classes,
        userLikes : res[index].user.metadata.connections.likes.total < 10 ? 'hidelessauthorLike' : ''
    }
    
  }


  // load data from server 
  function loadData () {
    ajaxRequest(settingsApp.url);
  }

  // wrapper for render function 
  function renderWrapper (res, i) {
    return tmpl('article', 
                { 
                    render : render(res,i) 
              }); 
  }

  // prepare our template to append to DOM 
  // we do all stuff in memory to increase performance 
  // res : respense { object JSON}
  // state : state of filter 
  // start fetching 
  // end : end fetching 
  function prepareTemplate (res, state, start, end) {
    var template = '';
    
    var tempFilter = state ? end : 50;
    while (start < tempFilter) {
        if (state) {
          if (!settingsApp.checklikes || res[start].user.metadata.connections.likes.total > 10) {
            template += renderWrapper (res, start);
          }
          else{
            if (start >= settingsApp.maxItems) {
              break;
              
            }else{
              tempFilter++;
            }
          }
          start++;
        }
        else {
          if (res[start].description == null ) {
            start++;
            continue;
          }

          if (res[start].description.toLowerCase().split(' ').indexOf(settingsApp.query.toLowerCase()) != -1) {
            template += renderWrapper (res, start);
          }
          start++;
        }
        
    }
    // append resulte to DOM
    DOM.content.innerHTML = template;

    
  }

  // manager navigations : 
  // usefull to show / hide next button
  function manageNav(cas) {
    var nav = document.getElementById('navigation');
    if (settingsApp.checklikes) {nav.style.display = 'none'; return;}
    switch (cas) {
       case '10' :
       case '25' : 
       case false : if (settingsApp.radiofilter != 50 ) {nav.style.display = 'block'};
      break; 
       case '50' :
       nav.style.display = 'none';
      break; 
    }
  }

  // manager all events handler
  function _event() {

      // filter per view
      var radios = document.getElementsByName('filter_view');

      for(var i = 0; i < radios.length; i++){
          radios[i].addEventListener('change', function (e) {

            settingsApp.radiofilter = this.value;
            prepareTemplate ( cachRespense.res, true, 0 , this.value  );
            manageNav(this.value);
          });
      }

      // filter more than 10 likes author 
      var filterLikeschkbox = document.getElementsByName('moretenlikes')[0];
      filterLikeschkbox.addEventListener('change', function () {
          settingsApp.checklikes = this.checked;
          prepareTemplate ( cachRespense.res, true, 0, settingsApp.radiofilter);
          manageNav(this.checked);
      });

      // listen on search input changes
      var search = document.getElementById('search');
      search.addEventListener('keyup', function () {
        if (this.value.length > 3){
          settingsApp.query = this.value.trim();
          prepareTemplate ( cachRespense.res, false, 0, cachRespense.res.length);
        }
      });

      var next = document.getElementById('next');
      var page = 0;
      var incr = 0;

      // next button click
      next.addEventListener('click', function () {
        
        if (settingsApp.radiofilter == 10) {
          page++;
          
          prepareTemplate ( cachRespense.res, true, incr+ parseInt(settingsApp.radiofilter,10) , incr+ parseInt(settingsApp.radiofilter,10)+parseInt(settingsApp.radiofilter,10) );
          incr+=10;
          if (page === 4 ) {
            incr = 0;
            document.getElementById('navigation').style.display = 'none';
          }
        }
        if (settingsApp.radiofilter == 25) {
          prepareTemplate ( cachRespense.res, true, cachRespense.res.length/2 - 1 , cachRespense.res.length - 1);
          document.getElementById('navigation').style.display = 'none';
        }
      });


  }

  

  // initial state
  function init () {
    loadData();
    _event ();
  }


  // init app
  init();


})();

// micro templating 
// John Resig - http://ejohn.org/ - MIT Licensed

(function(){
  var cache = {};

  this.tmpl = function tmpl(str, data){
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = !/\W/.test(str) ?
      cache[str] = cache[str] ||
        tmpl(document.getElementById(str).innerHTML) :

      // Generate a reusable function that will serve as a template
      // generator (and which will be cached).
      new Function("obj",
        "var p=[],print=function(){p.push.apply(p,arguments);};" +

        // Introduce the data as local variables using with(){}
        "with(obj){p.push('" +

        // Convert the template into pure JavaScript
        str
          .replace(/[\r\t\n]/g, " ")
          .split("<%").join("\t")
          .replace(/((^|%>)[^\t]*)'/g, "$1\r")
          .replace(/\t=(.*?)%>/g, "',$1,'")
          .split("\t").join("');")
          .split("%>").join("p.push('")
          .split("\r").join("\\'")
      + "');}return p.join('');");

    // Provide some basic currying to the user
    return data ? fn( data ) : fn;
  };
})();