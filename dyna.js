'use strict';

/**
 * @constructor
 */
var Dyna = function(){
};

Dyna.BlockPropertyChange = new Set(["tagName", "element", "children"]);

Dyna.ActionKeys = ["Space","Enter"];

Dyna.create = function(dynaElement,parentHolder=null){
  if(!Array.isArray(dynaElement)) return Dyna.createElement(dynaElement,parentHolder);
  for(let i=0;i<dynaElement.length;i++) {
    Dyna.createElement(dynaElement[i],parentHolder,i);
  }
  return dynaElement;
}


Dyna.dynaSetterGetter = function(o,k) {
  var stored = o[k];
  var setFunction = function(newValue) {
    if(newValue==stored) return stored;
    stored=newValue;
    Dyna.update(o);
    return stored;
  }

  var setBlock = function(newValue) {
    return stored;
  }

  var getFunction = function() {
    return stored;
  }

  return {
    set: Dyna.BlockPropertyChange.has(k)?setBlock:setFunction,
    get: getFunction
  };
}

/*
  given a dyna element
  create an element and associated sub-elements
*/
Dyna.createElement = function(dynaElement,parentHolder,index=null) {
  if(dynaElement==null) return dynaElement;
  if(dynaElement.children==null) dynaElement.children=[];
  if(!dynaElement.element) {
    dynaElement.element = document.createElement(dynaElement.tagName);
    for(let key in dynaElement) {
      Object.defineProperty(dynaElement,key, Dyna.dynaSetterGetter(dynaElement,key));
    };
    if(parentHolder) {
      Dyna.appendChildToParentAtPosition(dynaElement.element,parentHolder,index);
    }
  }
  if(parentHolder && dynaElement.element.parentElement!=parentHolder) {
    Dyna.appendChildToParentAtPosition(dynaElement.element,parentHolder,index);
  } else if(parentHolder && index!=null && parentHolder.children[index] != dynaElement.element) {
    Dyna.appendChildToParentAtPosition(dynaElement.element,parentHolder,index);
  }
  if(dynaElement.children==null) dynaElement.children = [];
  var eventListeners = {};
  for(let property in dynaElement) {
    if(Dyna.BlockPropertyChange.has(property)) continue;
    if(property=="text") {
      Dyna.updateInnerText(dynaElement.element,dynaElement["text"]);
      continue;
    }
    if(property=="class") {
      if(dynaElement.element["className"]==dynaElement["class"]) continue;
      dynaElement.element["className"]=dynaElement["class"];
      continue;
    }
    if(property.startsWith("on-")) {
      eventListeners[property.substring(3)] = dynaElement[property];
      continue;
    }
    if(dynaElement.element[property]==dynaElement[property]) continue;
    dynaElement.element[property]=dynaElement[property];
  }
  Dyna.updateEventListeners(dynaElement.element, eventListeners);
  Dyna.updateChildren(dynaElement);
  return dynaElement;
}


/*
  given a child, parent and an index
  appends the child into the parent at the given index
  (it's like node.appendChild but not stupid)
*/
Dyna.appendChildToParentAtPosition = function(childElement,parentElement,insertPosition=null) {
  if(insertPosition==null) return parentElement.appendChild(childElement);
  if(insertPosition>=parentElement.children.length) return parentElement.appendChild(childElement);
  parentElement.insertBefore(childElement,parentElement.children[insertPosition]);
}


/*
  given an element and text
  update innerText of the element
*/
Dyna.updateInnerText = function(element, newText) {
  if(element.childNodes.length>0) {
    for(let i=0;i<element.childNodes.length;i++) {
      if(element.childNodes[i].nodeType==3) {
        if(element.childNodes[i].textContent != newText)
          element.childNodes[i].textContent = newText;
        return;
      }
    }
  } else if(element.innerText != newText) {
    element.innerText = newText;
  }
}


/*
  given a dyna element
  updates the children
*/
Dyna.updateChildren = function(dynaElement) {
  var dynaChildren = dynaElement.element.dynaChildren;
  var spliced;
  if(!dynaChildren) dynaElement.element.dynaChildren = dynaChildren = [];
  if("children" in dynaElement) {
    for(let i in dynaElement["children"]) {
      Dyna.createElement(dynaElement["children"][i],dynaElement.element,i);
      if(dynaChildren.indexOf(dynaElement["children"][i])==-1) dynaChildren.push(dynaElement["children"][i]);
    }
  }
  for(let i=dynaChildren.length-1;i>=0;i--) {
    if(dynaElement.children.indexOf(dynaChildren[i])!=-1) continue;
    if(spliced = dynaChildren.splice(i,1)[0]) spliced.element.remove();
  }
}


/*
  given an element and a structure of event listeners
  updates the element's even listeners if needed
*/
Dyna.updateEventListeners = function(element, newEventListeners) {
  var existingEventListeners = element.dynaEventListeners;
  if(!existingEventListeners) element.dynaEventListeners = existingEventListeners = {};
  // remove listeners
  for(let e in existingEventListeners) {
    if(e in newEventListeners && existingEventListeners[e]==newEventListeners[e]) continue;
    if(!(e in newEventListeners) || existingEventListeners[e]!=newEventListeners[e]) {
      element.removeEventListener(e,existingEventListeners[e]);
      delete existingEventListeners[e];
      continue;
    }
  }
  // add listeners
  for(let e in newEventListeners) {
    if(e in existingEventListeners) continue;
    element.addEventListener(e,newEventListeners[e]);
    existingEventListeners[e] = newEventListeners[e];
  }
}

Dyna.genericTag = function(tagname, cls, text, options, kids) {
  var rv = {"tagName":tagname, "class":cls, "text":text, "children":kids};
  for(let o in options) rv[o] = options[o];
  return rv;
}

Dyna.div   = (cls,text=null,options=null,kids=null)=>Dyna.genericTag("div",    cls, text, options, kids);
Dyna.h1    = (cls,text=null,options=null,kids=null)=>Dyna.genericTag("h1",     cls, text, options, kids);
Dyna.h2    = (cls,text=null,options=null,kids=null)=>Dyna.genericTag("h2",     cls, text, options, kids);
Dyna.h3    = (cls,text=null,options=null,kids=null)=>Dyna.genericTag("h3",     cls, text, options, kids);
Dyna.span  = (cls,text=null,options=null,kids=null)=>Dyna.genericTag("span",   cls, text, options, kids);
Dyna.p     = (cls,text=null,options=null,kids=null)=>Dyna.genericTag("p",      cls, text, options, kids);
Dyna.a     = (cls,text=null,options=null,kids=null)=>Dyna.genericTag("a",      cls, text, options, kids);
Dyna.img   = (cls,text=null,options=null,kids=null)=>Dyna.genericTag("img",    cls, text, options, kids);
Dyna.form  = (cls,text=null,options=null,kids=null)=>Dyna.genericTag("form",   cls, text, options, kids);
Dyna.table = (cls,text=null,options=null,kids=null)=>Dyna.genericTag("table",  cls, text, options, kids);
Dyna.tr    = (cls,text=null,options=null,kids=null)=>Dyna.genericTag("tr",     cls, text, options, kids);
Dyna.td    = (cls,text=null,options=null,kids=null)=>Dyna.genericTag("td",     cls, text, options, kids);
Dyna.th    = (cls,text=null,options=null,kids=null)=>Dyna.genericTag("th",     cls, text, options, kids);
Dyna.a     = (cls,text=null,options=null,kids=null)=>Dyna.genericTag("a",      cls, text, options, kids);
Dyna.ul    = (cls,text=null,options=null,kids=null)=>Dyna.genericTag("ul",     cls, text, options, kids);
Dyna.ol    = (cls,text=null,options=null,kids=null)=>Dyna.genericTag("ol",     cls, text, options, kids);
Dyna.li    = (cls,text=null,options=null,kids=null)=>Dyna.genericTag("li",     cls, text, options, kids);

Dyna.ahref = (cls,text,href,options=null,kids=null)=>{
  if(options== null) options = {};
  if(options.href==null) options.href = href;
  return Dyna.genericTag("a", cls, text, options, kids);
}

Dyna.img = (cls,src,options=null,kids=null)=>{
  if(options==null) options = {};
  if(options.src==null) options.src = src;
  return Dyna.genericTag("img", cls, null, options, kids);
}

Dyna.btnLbl = function(cls,text,options=null,kids=null) {
  var rv = {
    "tagName":"label",
    "class":cls,
    "text":text,
    "tabIndex":0,
    "on-keypress": (e)=>{if(Dyna.ActionKeys.indexOf(e.code)!=-1) e.target.click();},
    "on-mouseout": (e)=>{e.target.blur();},
    "children": kids
  }
  for(let o in options) rv[o] = options[o];
  return rv;
}

Dyna.btn = function(cls,text,options=null,kids=null) {
  var rv = {
    "tagName":"button",
    "class":cls,
    "text":text,
    "tabIndex":0,
    "on-keypress": (e)=>{if(Dyna.ActionKeys.indexOf(e.code)!=-1) e.target.click();},
    "on-mouseout": (e)=>{e.target.blur();},
    "children": kids
  }
  for(let o in options) rv[o] = options[o];
  return rv;
}

Dyna.input = function(cls, type, options, kids=null) {
  const noop = ()=>{};
  var rv = {
    "tagName":"input",
    "class":cls,
    "type":type,
    "children": kids
  }
  for(let o in options) rv[o] = options[o];
  var requestedOnChange = rv["on-change"];
  rv["on-change"] = (e)=>{rv.value = e.target.value;requestedOnChange?requestedOnChange(e):noop()};
  return rv;
}

Dyna.textarea = function(cls, options, kids) {
  var rv = {
    "tagName": "textarea",
    "class": cls,
    "children": kids
  };
  for (var o in options) rv[o] = options[o];
  return rv;
}

Dyna.select = function(cls, options, kids) {
  var rv = {
    "tagName":"select",
    "class":cls,
    "children": kids
  }
  for(let o in options) rv[o] = options[o];
  return rv;
}

Dyna.label = function(cls, text, options, kids) {
  var rv = {
    "tagName":"label",
    "class":cls,
    "text":text,
    "children": kids
  }
  for(let o in options) rv[o] = options[o];
  return rv;
}

Dyna.options = function(optionlist, defaultOption = false, defaultText="") {
  var rv = [];
  if (defaultOption) {
    rv.push({ "tagName": "option", "value": "", "disabled": true, "selected": true, "style": "display:none;", "text": defaultText  });
  }
  for (var optionitem in optionlist) {
    var option = optionlist[optionitem];
    if (typeof option !== 'object') {
      rv.push({ "tagName": "option", "value": option, "text": option });
    } else {
      rv.push({ "tagName": "option", "value": option.value, "text": option.text });
    }
  }
  return rv;
}


Dyna.update = function(e) {
  Dyna.create(e,null);
}

Dyna.updateElement = function(e) {
  Dyna.createElement(e,null);
}

Dyna.show = (e)=>{
  e["class"] = e["class"].split(" ").filter(s=>s!=="hide").join(" ");
}
Dyna.hide = (e)=>{
  var c=e["class"].split(" ");
  if(!c.includes("hide")) c.push('hide'); e["class"]=c.join(" ");
}
Dyna.toggle = (e)=>{
  var c=e["class"].split(" ");
  if(!c.includes("hide")) {
     c.push('hide'); e["class"]=c.join(" ");
  } else {
    Dyna.show(e);
  }
}

Dyna.antishow = (e)=>{
  e["class"] = e["class"].split(" ").filter(s=>s!=="show").join(" ");
}
Dyna.antihide = (e)=>{
  var c=e["class"].split(" ");
  if(!c.includes("show")) c.push('show'); e["class"]=c.join(" ");
}
Dyna.antitoggle = (e)=>{
  var c=e["class"].split(" ");
  if(!c.includes("show")) {
     c.push('show'); e["class"]=c.join(" ");
  } else {
    Dyna.antishow(e);
  }
}

Dyna.replaceLast = (parentElem, elem) => {
  parentElem.children.pop();
  parentElem.children.push(elem);
  Dyna.update(parentElem);
}

Dyna.zabuttonWithIcon = function(iconurl, text, clickAction, extraclass=null) {
  return Dyna.zabutton(extraclass||"",null,{"on-click": clickAction},[
    Dyna.img("button-content",iconurl),
    Dyna.div("button-content",text)
  ]);
}

/*
  a more advanced button with interaction animation
*/
Dyna.zabutton = function(cls,text,options={},children=null) {
  const maxDistanceToCorner = (x1,y1,x2,y2)=>2*Math.max(Math.hypot(x2-x1,y2-y1),Math.hypot(x2-x1,y1),Math.hypot(x1,y2-y1),Math.hypot(x1,y1));
  var circle = null;
  if(!children) children = [Dyna.div("buttontext",text)];
  function touchingStarts(e) {
    var bbox = e.changedTouches[0].target.getBoundingClientRect();
    var tpos = {x:e.changedTouches[0].pageX-bbox.x, y:e.changedTouches[0].pageY-bbox.y};
    var size = maxDistanceToCorner(tpos.x,tpos.y,bbox.width,bbox.height);
    actionStart(tpos.x,tpos.y,size,e.changedTouches[0].target);
  }
  function mousingStarts(e) {
    var bbox = e.target.getBoundingClientRect();
    var size = maxDistanceToCorner(e.offsetX,e.offsetY,bbox.width,bbox.height);
    actionStart(e.offsetX,e.offsetY,size,e.target);
  }
  function actionStart(x,y,s,t) {
    if(circle!=null) return;
    circle = {
      "tagName":"span",
      "class":"buttoncircle",
      "style":`top:${y}px; left:${x}px;height:${s}px;width:${s}px`
    }
    children.unshift(circle);
    Dyna.update(rv);
    //console.log(children);
    //t.insertBefore(circle,t.children[0]);
  }
  function actionRelease() {
    if(!circle) return;
    removeCircle(circle);
    circle = null;
  }
  function removeCircle(circleref) {
    const delayedExecute = (fun, thisArg, argsArray, delay)=>window.setTimeout(function() {fun.apply(thisArg, argsArray)}, delay | 0);

    if(!circleref) return;
    circleref["class"] = 'buttoncircle remove';

    delayedExecute(removeChildCircle,null,[circleref],500);
  }

  function removeChildCircle(circleref) {
    var circleindex = children.indexOf(circleref);
    if(circleindex==-1) return;
    children.splice(circleindex,1);
    Dyna.update(rv);
  }

  var actionHandler = options["on-click"];
  options["on-click"] = ()=>{
    removeCircle(circle);
    circle = null;
    if(actionHandler) actionHandler();
  }
  var rv = {
    "tagName":"button",
    "class":"zabutton " + cls,
    "text":null,
    "tabIndex":0,
    "disabled":false,
    "on-keypress": (e)=>{if(Dyna.ActionKeys.indexOf(e.code)!=-1) e.target.click();},
    "on-mouseout": (e)=>{e.target.blur();actionRelease();},
    "on-mousedown": mousingStarts,
    "on-mouseover": mousingStarts,
    "on-touchstart":touchingStarts,
    "on-touchend":actionRelease,
    "children":children
  }
  for(let o in options) rv[o] = options[o];
  return rv;
}

/*
  given a dyna tree (like the one passed to createElement)
  removes the elements from the DOM
*/
Dyna.removeElement = function(dynaroot) {
  for(let i=0;i<dynaroot.length;i++) {
    if(!dynaroot[i].element) continue;
    dynaroot[i].element.remove();
  }
}
