/*
---
 
script: DOM.js
 
description: Provides DOM-compliant interface to play around with other widgets
 
license: Public domain (http://unlicense.org).

authors: Yaroslaff Fedin

requires:
  - LSD.Module
  - Core/Element.Event

provides:
  - LSD.Module.DOM
  - LSD.Module.DOM.findDocument

...
*/

!function() {

LSD.Module.DOM = new Class({
  options: {
    nodeType: 1,
  },
  
  initializers: {
    dom: function(options) {
      this.childNodes = [];
      this.nodeType = options.nodeType;
      this.nodeName = this.tagName = options.tag;
      return {
        events: {
          element: {
            'dispose': 'dispose'
          },
          self: {
            'destroy': function() {
              if (this.parentNode) this.dispose();
            }
          }
        }
      }
    }
  },
  
  getElements: function(selector) {
    return Slick.search(this, selector)
  },
  
  getElement: function(selector) {
    return Slick.find(this, selector)
  },
  
  contains: function(element) {
    while (element = element.parentNode) if (element == this) return true;
    return false;
  },
  
  getChildren: function() {
    return this.childNodes;
  },

  getRoot: function() {
    var widget = this;
    while (widget.parentNode) widget = widget.parentNode;
    return widget;
  },
  
  setParent: function(widget){
    widget = LSD.Module.DOM.find(widget);
    this.parentNode = widget;
    this.fireEvent('setParent', [widget, widget.document])
    var siblings = widget.childNodes;
    var length = siblings.length;
    if (length == 1) widget.firstChild = this;
    widget.lastChild = this;
    var previous = siblings[length - 2];
    if (previous) {
      previous.nextSibling = this;
      this.previousSibling = previous;
    }
  },
  
  unsetParent: function(widget) {
    var parent = this.parentNode;
    if (parent.firstChild == this) delete parent.firstChild;
    if (parent.lastChild == this) delete parent.lastChild;
    delete this.parentNode;
  },
  
  appendChild: function(widget, adoption) {
    this.childNodes.push(widget);
    widget.setParent(this);
    if (!widget.quiet && (adoption !== false) && this.toElement()) (adoption || function() {
      this.element.appendChild(widget.toElement());
    }).apply(this, arguments);
    delete widget.quiet;
    this.fireEvent('adopt', [widget]);
    LSD.Module.DOM.walk(widget, function(node) {
      this.dispatchEvent('nodeInserted', node);
    }, this);
    return true;
  },
  
  removeChild: function(widget) {
    widget.unsetParent(this);
    LSD.Module.DOM.walk(widget, function(node) {
      this.dispatchEvent('nodeRemoved', node);
    }, this);
    this.childNodes.erase(widget);
  },
  
  insertBefore: function(insertion, element) {
    return this.appendChild(insertion, function() {
      element.parentNode.insertBefore(document.id(insertion), document.id(element))
    });
  },
  
  extractDocument: function(widget) {
    var element = widget.lsd ? widget.element : widget;;
    var isDocument = widget.documentElement || (instanceOf(widget, LSD.Document));
    var parent = this.parentNode;
    if (isDocument  // if document
    || (parent && parent.dominjected) //already injected widget
    || (widget.ownerDocument && (widget.ownerDocument.body == widget)) //body element
    || element.offsetParent) { //element in dom (costy check)
      return (parent && parent.document) || (isDocument ? widget : LSD.Module.DOM.findDocument(widget));
    }
  },
  
  setDocument: function(document) {
    LSD.Module.DOM.walk(this, function(child) {
      child.ownerDocument = child.document = document;
      child.fireEvent('dominject', [child.element.parentNode, document]);
      child.dominjected = true;
    });
    return this;
  },
  
  inject: function(widget, where, quiet) {
    if (!widget.lsd) {
      var instance = LSD.Module.DOM.find(widget, true)
      if (instance) widget = instance;
    }
    this.quiet = quiet || (widget.documentElement && this.element && this.element.parentNode);
    if (where === false) widget.appendChild(this, false)
    else if (!inserters[where || 'bottom'](widget.lsd ? this : this.toElement(), widget) && !quiet) return false;
    if (quiet !== true || widget.document) {
      var document = widget.document || (this.documentElement ? this : this.extractDocument(widget));
      if (document) this.setDocument(document);
    }
    this.fireEvent('inject', this.parentNode);
    return this;
  },

  grab: function(el, where){
    inserters[where || 'bottom'](document.id(el, true), this);
    return this;
  },
  
  /*
    Wrapper is where content nodes get appended. 
    Defaults to this.element, but can be redefined
    in other Modules or Traits (as seen in Container
    module)
  */
  
  getWrapper: function() {
    return this.toElement();
  },
  
  write: function(content) {
    var wrapper = this.getWrapper();
    if (this.written) for (var node; node = this.written.shift();) Element.dispose(node);
    var fragment = document.createFragment(content);
    this.written = Array.prototype.slice.call(fragment.childNodes, 0);
    wrapper.appendChild(fragment);
    this.fireEvent('write', [this.written])
    this.innerText = wrapper.get('text').trim();
    return this.written;
  },

  replaces: function(el){
    this.inject(el, 'after');
    el.dispose();
    return this;
  },
  
  onDOMInject: function(callback) {
    if (this.document) callback.call(this, this.document.element) 
    else this.addEvent('dominject', callback.bind(this))
  },

  dispose: function(element) {
    var parent = this.parentNode;
    if (!parent) return;
    this.fireEvent('beforeDispose', parent);
    parent.removeChild(this);
    this.fireEvent('dispose', parent);
    return this;
  }
});

var inserters = {

  before: function(context, element){
    var parent = element.parentNode;
    if (parent) return parent.insertBefore(context, element);
  },

  after: function(context, element){
    var parent = element.parentNode;
    if (parent) return parent.insertBefore(context, element.nextSibling);
  },

  bottom: function(context, element){
    return element.appendChild(context);
  },

  top: function(context, element){
    return element.insertBefore(context, element.firstChild);
  }

};

Object.append(LSD.Module.DOM, {
  walk: function(element, callback, bind, memo) {
    var i = element.lsd ? -1 : 0;
    for (var nodes = element.childNodes, node; node = (i > -1) ? nodes[i] : element; i++) {
      if (node.nodeType != 1) continue;
      var widget = LSD.Module.DOM.find(node, true);
      if (widget) {
        var result = callback.call(bind || this, widget, memo);
        if (result) (memo || (memo = [])).push(widget);
      }
      if (i > -1) LSD.Module.DOM.walk(widget || node, callback, bind, memo);
    }
    return memo;
  },
  
  find: function(target, lazy) {
    return target.lsd ? target : ((!lazy || target.uid) && Element[lazy ? 'retrieve' : 'get'](target, 'widget'));
  },
  
  findDocument: function(target) {
    if (target.documentElement) return target;
    if (target.document) return target.document;
    if (target.lsd) return;
    var body = target.ownerDocument.body;
    var document = (target != body) && Element.retrieve(body, 'widget');
    while (!document && (target = target.parentNode)) {
      var widget = Element.retrieve(target, 'widget')
      if (widget) document = (widget instanceof LSD.Document) ? widget : widget.document;
    }
    return document;
  },
  
  getID: function(target) {
    if (target.lsd) {
      return target.attributes.itemid;
    } else {
      return target.getAttribute('itemid');
    }
  }
});

}();