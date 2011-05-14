/*
---
 
script: ContentEditable.js
 
description: Animated ways to show/hide widget
 
license: Public domain (http://unlicense.org).
 
requires:
  - LSD.Mixin
  - CKEditor/core._bootstrap
  - CKEditor/skins.ias.skin
  - CKEditor/lang.en
  - CKEditor/themes.default.theme
  - CKEditor/plugins.basicstyles.plugin
  - CKEditor/plugins.button.plugin
  - CKEditor/plugins.clipboard.plugin
  - CKEditor/plugins.contextmenu.plugin
  - CKEditor/plugins.enterkey.plugin
  - CKEditor/plugins.htmldataprocessor.plugin
  - CKEditor/plugins.iframe.plugin
  - CKEditor/plugins.indent.plugin
  - CKEditor/plugins.link.plugin
  - CKEditor/plugins.list.plugin
  - CKEditor/plugins.pastefromword.plugin
  - CKEditor/plugins.pastetext.plugin
  - CKEditor/plugins.removeformat.plugin
  - CKEditor/plugins.stylescombo.plugin
  - CKEditor/plugins.tab.plugin
  - CKEditor/plugins.toolbar.plugin
  - CKEditor/plugins.wysiwygarea.plugin
  - CKEditor/plugins.autogrow.plugin
  - CKEditor/plugins.styles.plugin
  - CKEditor/plugins.dialog.plugin
  - CKEditor/plugins.menu.plugin
  - CKEditor/plugins.fakeobjects.plugin
  - CKEditor/plugins.domiterator.plugin
  - CKEditor/plugins.richcombo.plugin
  - CKEditor/plugins.editingblock.plugin
  - CKEditor/plugins.dialogui.plugin
  - CKEditor/plugins.dialog.plugin
  - CKEditor/plugins.keystrokes.plugin
  - CKEditor/plugins.htmlwriter.plugin
  - CKEditor/plugins.selection.plugin
  - CKEditor/plugins.floatpanel.plugin
  - CKEditor/plugins.listblock.plugin
  - CKEditor/plugins.panel.plugin
 
provides: 
  - LSD.Mixin.ContentEditable
...
*/

LSD.Mixin.ContentEditable = new Class({
  options: {
    ckeditor: {
      toolbarCanCollapse: false,
      linkShowAdvancedTab: false,
      linkShowTargetTab: false,
      invisibility: true,
      skin: 'ias',
      toolbar: [['Bold', 'Italic', 'Strike', '-', 'Link', 'Unlink', '-', 'NumberedList', 'BulletedList', '-', 'Indent', 'Outdent', '-','Styles', '-', 'PasteFromWord', 'RemoveFormat']],
      removeFormatTags: 'dialog,img,input,textarea,b,big,code,del,dfn,em,font,i,ins,kbd,q,samp,small,span,strike,strong,sub,sup,tt,u,var,iframe',
      removeFormatAttributes: 'id,class,style,lang,width,height,align,hspace,valign',
      contentsCss: '/stylesheets/layout/application/iframe.css',
      extraPlugins: 'autogrow',
      customConfig: false,
      language: 'en',
      removePlugins: 'bidi,dialogadvtab,liststyle,about,elementspath,blockquote,popup,undo,colorbutton,colordialog,div,entities,filebrowser,find,flash,font,format,forms,horizontalrule,image,justify,keystrokes,maximize,newpage,pagebreak,preview,print,resize,save,scayt,smiley,showblocks,showborders,sourcearea,style,table,tabletools,specialchar,templates,wsc,a11yhelp,a11yhelp',
      stylesSet: [
        { name : 'Paragraph', element : 'p' },
      	{ name : 'Heading 1', element : 'h1' },
      	{ name : 'Heading 2', element : 'h2' }
      ]
    }
  },
  
  getEditor: Macro.getter('editor', function() {
    var value = this.getValueForEditor()
    var editor = new CKEDITOR.editor( this.options.ckeditor, this.getEditedElement(), 1, value);
    
    editor.on('focus', function() {
      if (this.editor) this.getEditorContainer().addClass('focus');
    }.bind(this));
    editor.on('blur', function() {
      if (this.editor) this.getEditorContainer().removeClass('focus');
    }.bind(this));
    editor.on('contentDom', function() {
      this.showEditor();
      this.fireEvent('editorReady');
      
      !function() {
        
        if (Browser.firefox) {
          var body = this.getEditorBody()
          body.contentEditable = false;
          body.contentEditable = true;
          console.error(body)
      }
      this.editor.focus();
      this.editor.forceNextSelectionCheck();
      this.editor.focus();
      
      }.delay(100, this)
    }.bind(this));
    
    return editor;
  }),
  
  getValueForEditor: function() {
    var element = this.getEditedElement();
    switch (element.get('tag')) {
      case "input": case "textarea":
        return element.get('value');
      default:
        return element.innerHTML;
    }
  },
  
  showEditor: function() {
    this.element.setStyle('display', 'none');
    this.getEditorContainer().setStyle('visibility', 'visible');
  },
  
  hideEditor: function() {
    this.element.setStyle('display', '');
    this.getEditorContainer().setStyle('visibility', 'hidden');
  },
  
  useEditor: function(callback) {
    if (this.editor && this.editor.document) callback.call(this.editor);
    this.addEvent('editorReady:once', callback);
    this.getEditor();
  },
  
  getEditorContainer: function() {
    return $(this.editor.container.$);
  },
  
  getEditorBody: function() {
    return this.editor.document.$.body;
  },
  
  getEditedElement: function() {
    return this.element;
  }
});

LSD.Behavior.define('[contenteditable=editor]', LSD.Mixin.ContentEditable);