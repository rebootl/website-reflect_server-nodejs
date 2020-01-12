import { html, render } from 'lit-html';
import { api } from './resources/api-service.js';
import './entry-header.js';
import './entry-item.js';
import './gen-elements/labelled-checkbox.js';

const style = html`
  <style>
    :host {
      display: block;
      box-sizing: border-box;
    }
    entry-input {
      margin-top: 20px;
    }
    a {
      color: var(--primary);
    }
    pre {
      color: var(--light-text-med-emph);
    }
    labelled-button {
      margin-top: 10px;
    }
    labelled-checkbox {
      margin-top: 10px;
      margin-left: 20px;
    }
    #input-overlay {
      background-color: var(--surface);
      margin-bottom: 10px;
      border-radius: 5px;
      overflow: hidden;
    }
    #buttonsBox {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
    }
    .boxItem {
      margin-right: 10px;
    }
    #cancelButton {
      margin-top: 5px;
    }
    #deleteButton {
      /* align to the right */
      margin-left: auto;
    }
  </style>
`;

class ViewEditEntry extends HTMLElement {
  get activeTopics() {
    return this._activeTopics || [];
  }
  set activeTopics(v) {
    this._activeTopics = v;
    if (v.length < 1) this.activeTags = [];
    this.update();
  }
  get activeTags() {
    return this._activeTags || [];
  }
  set activeTags(v) {
    this._activeTags = v;
    this.update();
  }
  get newTopics() {
    return this._newTopics || [];
  }
  set newTopics(v) {
    this._newTopics = v;
    this.update();
  }
  get newTags() {
    return this._newTags || [];
  }
  set newTags(v) {
    this._newTags = v;
    this.update();
  }
  get valid() {
    if (this.activeTopics.length < 1 && this.newTopics.length < 1)
      return false;
    return true;
  }
  set urlStateObject(v) {
    this._urlStateObject = v;
  }
  get urlStateObject() {
    return this._urlStateObject;
  }
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }
  connectedCallback() {
    this.updateQuery();
  }
  triggerUpdate() {
    this.updateQuery();
  }
  async updateQuery() {
    const params = this.urlStateObject.params;
    const entryId = params.id || [];
    console.log(entryId);
    const db = await api.getSource('entries');
    const [ entry ] = await db.query({ id: entryId });
    this.oldEntry = entry;
    if (entry) {
      this.activeTopics = entry.topics;
      this.activeTags = entry.tags;
    }
    this.update();
  }
  async saveEntry(close) {
    const db = await api.getSource('entries');
    const mdate = new Date();
    const _private = this.shadowRoot.querySelector('#privateCheckbox').value;
    const pinned = this.shadowRoot.querySelector('#pinnedCheckbox').value;
    // there are problems when relying on the "updated" this.entry alone
    // e.g. changing the text and then afterwards changing the topics
    // results in the oldEntry text to be set in this.entry and stored,
    // but on-screen is the changed text
    // therefor querying the result here
    // alternative: set input via query
    const result = this.shadowRoot.querySelector('entry-input').result;
    //console.log("result: ", result);
    // remove duplicates
    const newTopics = this.newTopics.filter((t) =>
      !this.activeTopics.includes(t));
    const newTags = this.newTags.filter((t) =>
      !this.activeTags.includes(t));
    this.activeTopics = [ ...this.activeTopics, ...newTopics ];
    this.activeTags = [ ...this.activeTags, ...newTags ];
    const entry = {
      ...result,
      id: this.oldEntry.id,
      date: this.oldEntry.date,
      mdate: mdate,
      topics: this.activeTopics,
      tags: this.activeTags,
      private: _private,
      pinned: pinned,
    };
    //console.log("entry: ", entry);
    await db.update({ id: this.oldEntry.id }, entry);
    console.log("updated entry!!");
    console.log("id: " + entry.id);
    if (close) window.history.back();
    // reset stuff
    this.shadowRoot.querySelector('#add-topics').reset();
    this.shadowRoot.querySelector('#add-tags').reset();
  }
  async deleteEntry() {
    if (!confirm("Do you really want to delete this entry!")) return;
    const db = await api.getSource('entries');
    await db.delete({ id: this.oldEntry.id });
    console.log("entry deleted!!");
    console.log("id: " + this.oldentry.id);
    window.history.back();
  }
  update() {
    render(html`${style}
      ${ this.oldEntry ?
        html`
          <entry-header .entry=${this.oldEntry} noedit></entry-header>
          <entry-input .oldEntry=${this.oldEntry}
            @loaded=${(e)=>this.entry=e.detail}
            @inputchange=${(e)=>{this.entry = e.detail}}
            cols="45" rows=${this.oldEntry.type === 'note' ? 10 : 1}
            ></entry-input>
          <div id="buttonsBox">
            <labelled-button class="boxItem" ?disabled=${!this.valid}
              @click=${()=>this.saveEntry()} label="Save"
              ></labelled-button>
            <labelled-button class="boxItem" ?disabled=${!this.valid}
              @click=${()=>this.saveEntry(true)} label="Save and Close"
              ></labelled-button>
            <a id="cancelButton" class="boxItem" href="javascript:history.back()">Cancel</a>
            <labelled-checkbox id="privateCheckbox"
              ?checked=${this.oldEntry.private}>Private</labelled-checkbox>
            <labelled-checkbox id="pinnedCheckbox" class="boxItem"
              ?checked=${this.oldEntry.pinned}>Pin</labelled-checkbox>
            <labelled-button id="deleteButton" ?disabled=${!this.valid} warn
              @click=${()=>this.deleteEntry(true)} label="Delete"
            ></labelled-button>
          </div>
          <pre>[preview todo]</pre>
          <div id="input-overlay">
            <add-items id="add-topics" label="New Topic..."
                       @itemschanged=${(e)=>{this.newTopics = e.detail}}></add-items>
            <topics-list .activeTopics=${this.activeTopics}
                         @selectionchanged=${(e)=>{this.activeTopics = e.detail}}>
            </topics-list>
            <add-items id="add-tags" label="New Tag..."
                       @itemschanged=${(e)=>{this.newTags = e.detail}}></add-items>
            <subtags-list .activeTopics=${this.activeTopics} .activeSubtags=${this.activeTags}
                          @selectionchanged=${(e)=>{this.activeTags = e.detail}}>
            </subtags-list>
          </div>
          `
        :
        html`<pre>Ooops, entry not found... :/</pre>` }
      `, this.shadowRoot);
  }
}

customElements.define('view-edit-entry', ViewEditEntry);
