import { html, render } from 'lit-html';
import { imagestore } from './resources/imagestore.js';

const style = html`
  <style>
    :host {
      display: flex;
      box-sizing: border-box;
      flex-wrap: wrap;
    }
    .imageBox {
      display: flex;
      flex-direction: column;
      width: 150px;
      align-items: center;
    }
    .filename {
      display: block;
      overflow-wrap: anywhere;
      margin-bottom: 5px;
    }
    .uploadCheckbox {
      margin-top: 10px;
      margin-bottom: 10px;
    }
    .imageBox img {
      width: 100%;
    }
  </style>
`;

class EditImages extends HTMLElement {
  set loadimages(v) {
    this._images = v;
    this.update();
  }
  get images() {
    return this._images || [];
  }
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }
  connectedCallback() {
    this.update();
  }
  _toggleRemoval(i) {
    i.remove = !i.remove;
    this.update();
  }
  _toggleUpload(i) {
    // -> make this button "upload now" instead ?!
    if (i.upload) {
      delete i.upload;
    } else {
      i.upload = true;
    }
    this.update();
  }
  async removeMarkedLocalImages() {
    // remove local images that are marked for removal from store
    // called when entry saved
    /*for (const image of this.images) {
      if (image.remove && !image.uploaded) {
        await imagestore.deleteStoredImage(image.filename);
      }
    }*/
    await Promise.all(this.images
      .filter((i)=>i.remove && !i.uploaded)
      .map((i)=>imagestore.deleteStoredImage(i.filename)));
  }
  async removeLocalImages() {
    // remove all loaded local images from store
    // called when entry deleted
    /*for (const image of this.images) {
      if (!image.uploaded) {
        await imagestore.deleteStoredImage(image.filename);
      }
    }*/
    await Promise.all(this.images
    .filter((i)=>!i.uploaded)
    .map((i)=>imagestore.deleteStoredImage(i.filename)));
  }
  async uploadStoredImages() {
    // also called when entry saved
    const images = await Promise.all(this.images.map(async (i) => {
      if (i.upload) {
        // sets i.uploading and i.progress during upload
        // i.uploaded and i.filepath when success
        console.log(i)
        for await (const r of imagestore.uploadStoredImageGenerator(i)) {
          i = r;
          this.update();
        }
        if (i.uploaded) {
          delete i.upload;
        }
        /*
        image.uploading = true;
        this.update();
        const r = await imagestore.uploadStoredImage(image.filename);
        if (r.uploaded) {
          image.filepath = r.filepath;
          image.uploaded = true;
          if (image.upload) delete image.upload;
        }
        delete image.uploading;
        this.update();*/
      }
      return i;
    }));
    return images;
  }
  // (query on save instead)
  /*  this.dispatchChange();
  dispatchChange() {
    this.dispatchEvent(new CustomEvent('imagechange', {detail: this.images}));
    this.update();
  }*/
  update() {
    render(html`${style}
      ${ this.images.map((i) => html`
        <div class="imageBox">
          ${ i.uploading ? html`uploading...
            <progress max="100" value=${i.progress}>${i.progress}%</progress>
            ` : html `` }
          <img class="preview" src=${i.previewData} />
          <small class="filename">${i.filename}</small>
          ${ !i.uploaded && !i.remove ? html`
            stored locally<br>
            <labelled-checkbox class="uploadCheckbox"
                               ?checked=${this.upload}
                               @click=${e=>this._toggleUpload(i)}>
              Upload
            </labelled-checkbox>
            ` : html`` }
          ${ !i.uploading ? html`
            ${ i.remove ? html`
              Marked for removal!
              <labelled-button @click=${e=>this._toggleRemoval(i)}>
                Keep
              </labelled-button>` : html`
              <labelled-button warn @click=${(e)=>this._toggleRemoval(i)}>
                Remove
              </labelled-button>` }
          ` : html`` }
        </div>` )}
    `, this.shadowRoot);
  }
}

customElements.define('edit-images', EditImages);