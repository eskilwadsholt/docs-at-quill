import React, { useCallback, useRef } from 'react';
import './App.css';
import 'quill';
import 'quill/dist/quill.snow.css';
import 'katex';
import 'katex/dist/katex.min.css';
import 'katex/dist/contrib/auto-render';

declare var require: any;

let Quill: any;
let Katex: any;
let AutoRender: any;

if (!AutoRender) {
  AutoRender = require('katex/dist/contrib/auto-render');
}

if (!Quill) {
  Quill = require('quill');
}

if (!Katex) {
  Katex = require('katex');
}

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: '' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],
  ["image", "blockquote", "code-block"],
  ["clean"],
]

function App() {
  let mouseOverRef = useRef<HTMLDivElement>(null);
  
  const scrollOther = (e:React.UIEvent<HTMLDivElement>, ref:React.RefObject<HTMLDivElement>) => {
    if (ref.current && e.target instanceof HTMLDivElement) {
      ref.current.scrollTop = e.target.scrollTop;
      ref.current.scrollLeft = e.target.scrollLeft;
    }
  }
  const mathRef = useRef<HTMLDivElement>(null);
  const upperWrapperRef = useRef<HTMLDivElement>(null);
  const lowerWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useCallback((wrapper) => {
    if (wrapper instanceof HTMLDivElement) {
      wrapper.innerHTML = '';

      if (mathRef.current) {
        mathRef.current.innerHTML = '';
      }

      const editor = document.createElement('div');
      wrapper.append(editor);

      const quill = new Quill(editor, {
        theme: "snow",
        modules: { toolbar: TOOLBAR_OPTIONS },
      });

      quill.on('text-change', () => {

        if (mathRef.current) {
          mathRef.current.innerHTML = '';

          // Clone div from input quill and render math in output
          const inputClone:HTMLDivElement = quill.root.cloneNode(true);
          let content:string[] = [];
          let nodes:ChildNode[] = [];
          let deleteNodes:ChildNode[] = [];

          // Process children in clone to detect environments spanning accross HTML-tags
          inputClone.childNodes.forEach(elem => {
            if (elem.textContent) {
              if (content.length) {
                if (elem.nodeName === 'P' && elem.textContent === '$$') {
                  //console.debug('environment close');
                  content.push('$$');
                  nodes.push(elem);
                  const newNode = document.createElement('eq');
                  newNode.innerHTML = content.join('');
                  inputClone.replaceChild(newNode, nodes[0]);
                  deleteNodes.push(...nodes.slice(1));
                  nodes = [];
                  content = [];
                } else {
                  content.push(elem.textContent);
                  nodes.push(elem);
                }
              }
              else if (elem.nodeName === 'P' && elem.textContent === '$$') {
                //console.debug('environment open');
                content.push('$$');
                nodes.push(elem);
              }
            } else if (content.length) {
              console.debug(elem);
              nodes.push(elem);
            }
          });
          deleteNodes.forEach(elem => elem.remove());

          inputClone.setAttribute('contenteditable', 'false');
          mathRef.current.append(inputClone);
        }
        
        // Render math in output
        AutoRender.default(mathRef.current, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
            ],
            throwOnError : false
        });
      });
    }
  }, []);

  return (
    <div className="App">
      <div className="wrapper"
        ref={upperWrapperRef}
        onMouseOver={() => mouseOverRef = upperWrapperRef}
        onScroll={e => {
          if (mouseOverRef === upperWrapperRef) scrollOther(e, lowerWrapperRef)}
      }>
        <div className="section-label">
          <div className="rotate-label">
          INPUT
          </div>
        </div>
        <div id="container" ref={containerRef}></div>
      </div>
      <div className="wrapper lower"
        ref={lowerWrapperRef}
        onMouseOver={() => mouseOverRef = lowerWrapperRef}
        onScroll={e => {
          if (mouseOverRef === lowerWrapperRef) scrollOther(e, upperWrapperRef)}
      }>
        <div className="section-label">
          <div className="rotate-label">
          OUTPUT
          </div>
        </div>
        <div className="ql-katex ql-snow" ref={mathRef}></div>
      </div>
    </div>
  );
}

export default App;
