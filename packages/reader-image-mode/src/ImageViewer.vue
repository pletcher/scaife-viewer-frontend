<template>
  <div class="open-seadragon">
    <div :id="`${reference}-image-toolbar`" class="toolbar">
      <span v-show="displayViewer">
        <small>
          <a :id="`${reference}-home`" class="link" title="Go home">
            <icon name="home" />
          </a>
          <a :id="`${reference}-zoom-in`" class="link" title="Zoom in">
            <icon name="search-plus" />
          </a>
          <a :id="`${reference}-zoom-out`" class="link" title="Zoom out">
            <icon name="search-minus" />
          </a>
          <a :id="`${reference}-full-page`" class="link" title="Toggle full page">
            <icon name="window-maximize" />
          </a>
          <a :id="`${reference}-highlight-roi`" class="link" :class="{ active: showClickableRois }"
            title="Highlight regions of interest" @click.prevent="showClickableRois = !showClickableRois">
            <icon name="highlighter" />
          </a>
        </small>
      </span>
    </div>
    <div v-show="displayViewer" :id="identifier" class="viewer"></div>
    <div v-show="errorMessage" class="error">
      <i class="fa fa-times-circle"></i>
      <span>&nbsp;<strong>Error:</strong></span>
      <p>{{ errorMessage }}</p>
    </div>
    <Attribution>
      <a href="http://www.homermultitext.org" target="_blank">
        Homer Multitext Project / Center for Hellenic Studies
      </a>
    </Attribution>
  </div>
</template>

<script>
import OpenSeadragon from 'openseadragon';
import { Attribution } from '@scaife-viewer/common';
import { MODULE_NS, HIGHLIGHT_TRANSCRIPTION } from '@scaife-viewer/store';

export default {
  props: ['imageIdentifier', 'reference', 'roi'],
  data() {
    return {
      viewer: null,
      displayViewer: false,
      errorMessage: null,
      showClickableRois: false,
    };
  },
  components: { Attribution },
  watch: {
    imageIdentifier: {
      immediate: true,
      handler() {
        this.updateImage();
      },
    },
    selectedLine: {
      immediate: true,
      handler() {
        this.clearRoiOverlays();
        this.drawRoiOverlays();
        return this.$store.state[MODULE_NS].selectedLine;
      }
    },
    showClickableRois(show) {
      this.clearRoiOverlays();

      if (show) {
        this.drawClickableRoiOverlays();
      }
    },
    viewer: {
      immediate: true,
      handler() {
        this.updateImage();
      },
    },
  },
  computed: {
    identifier() {
      return `image-viewer-${this.reference}`;
    },
    selectedLine() {
      return this.$store.state[MODULE_NS].selectedLine
    },
    viewerOptions() {
      return {
        // options: http://openseadragon.github.io/docs/OpenSeadragon.Viewer.html#Viewer
        maxZoomLevel: 5,
        showNavigator: true,
        homeFillsViewer: true,
        zoomInButton: `${this.reference}-zoom-in`,
        zoomOutButton: `${this.reference}-zoom-out`,
        homeButton: `${this.reference}-home`,
        fullPageButton: `${this.reference}-full-page`,
        id: this.identifier,
      };
    },
  },
  methods: {
    updateImage() {
      if (this.imageIdentifier && this.viewer) {
        this.viewer.open([`${this.imageIdentifier}info.json`]);
      }
    },
    clearRoiOverlays() {
      if (this.viewer && this.viewer.currentOverlays.length > 0) {
        this.viewer.clearOverlays();
      }
    },
    drawClickableRoiOverlays() {
      this.$props.roi.forEach(r => r.roi.forEach(roi => {
        const element = createClickableOverlay(roi.coordinatesValue);
        const location = createRect(roi.coordinatesValue, this.viewer);

        this.viewer.addOverlay({
          element,
          location,
        });

        new OpenSeadragon.MouseTracker({
          element: element,
          clickHandler: _evt => {
            this.$store.dispatch(`${MODULE_NS}/${HIGHLIGHT_TRANSCRIPTION}`, {
              ref: r.ref,
            });
          },
        });
      }));
    },
    drawRoiOverlays() {
      if (!this.viewer) {
        return;
      }
      const selectedLine = this.$store.state[MODULE_NS].selectedLine;
      const roi = this.$props.roi;

      /*
        https://codepen.io/jacobwegner/pen/QWBqLXo
        // "By default the viewport coordinates go from 0 to 1 along the horizontal axis,
        // but from 0 to height / width on the vertical axis."
        // https://github.com/openseadragon/openseadragon/issues/2046#issuecomment-940360219
        // https://github.com/openseadragon/openseadragon/issues/1793
        // This is why we have drift on the vertical axis: the percentage-based
        // y / height coordinates from IIIF must be changed to their viewport coordinate values
        // imageToViewportRectangle converts from an image in pixels
        // to viewport units
       */

      roi.filter(r => selectedLine.endsWith(r.ref)).forEach(_r => {
        // it is possible for a line to have multiple
        // regions of interest, although usually there
        // will only be one.
        _r.roi.forEach(r => {
          const overlay = createOverlay(r.coordinatesValue);
          const rect = createRect(r.coordinatesValue, this.viewer);

          this.viewer.addOverlay({
            element: overlay,
            location: rect,
          });
        });
      });
    },
    initViewer() {
      if (!this.viewer) {
        const instanceOptions = this.viewerOptions;
        this.viewer = OpenSeadragon(instanceOptions);
      }
      const openHandler = () => {
        this.errorMessage = null;
        this.displayViewer = true;
      };
      const openFailedHandler = err => {
        this.errorMessage = err.message;
        this.displayViewer = false;
      };
      this.viewer.addHandler('open', openHandler, false);
      this.viewer.addHandler('open-failed', openFailedHandler, false);
    },
  },
  mounted() {
    this.initViewer();
    this.displayViewer = false;
  },
};

function createClickableOverlay(coordinatesValue) {
  const overlay = document.createElement('div');
  overlay.className = "roi-clickable";
  overlay.id = coordinatesValue;

  return overlay;
}

function createOverlay(coordinatesValue) {
  const overlay = document.createElement('div');
  overlay.className = "roi-highlight";
  overlay.id = coordinatesValue;

  return overlay;
}

function createRect(coordinatesValue, viewer) {
  const location = coordinatesValue.split(',').map(s => parseFloat(s));
  const imageX = viewer.source.dimensions.x;
  const imageY = viewer.source.dimensions.y;
  const pixelDimensions = [
    location[0] * imageX,
    location[1] * imageY,
    location[2] * imageX,
    location[3] * imageY,
  ];

  return viewer.viewport.imageToViewportRectangle(...pixelDimensions);
}
</script>

<style lang="scss">
.main-layout.main-layout-wide {
  flex: 4;

  .open-seadragon {
    padding-left: 1rem;
    border-left: 1px solid var(
      --sv-reader-image-mode-wide-layout-openseadragon-border-color,
      #dee2e6
    );
  }

  .image .open-seadragon {
    border: none;
    padding-left: 0;
  }
}

.roi-clickable {
  border: 4px solid var(
    --sv-widget-reader-dictionary-resolved-background-color,
    #9ad5f5
  );
  opacity: 0.1;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
}

.roi-highlight {
  border: 4px solid var(
    --sv-widget-reader-token-selected-entity-shadow-color,
    #9f9
  );
  opacity: 0.6;
}
</style>

<style lang="scss" scoped>
.open-seadragon {
  flex: 1;
  // height: calc(100vh - 150px);
  display: flex;
  flex-direction: column;

  .viewer {
    width: 100%;
    flex: 1;
  }

  $link-base-color: var(--sv-reader-image-mode-openseadragon-hover-link-text-color, #fff);
  $link-highlight-color: var(--sv-reader-image-mode-openseadragon-hover-link-background-color, #b45141);

  .link {
    font-size: 18px;
    cursor: pointer;
    margin: 0 0.5rem;
    padding: 0.25rem;
    border-radius: 3px;
  }

  .active {
    color: $link-base-color;
    background: $link-highlight-color;
  }

  .link:hover {
    color: $link-base-color;
    background: $link-highlight-color;
  }

  .error {
    margin: 10px 0px;
    padding: 12px;
    color: var(--sv-reader-image-mode-error-text-color, #d8000c);
    background-color: var(--sv-reader-image-mode-error-background-color,
        #ffd2d2);
    vertical-align: middle;
    max-width: 40em;
  }
}
</style>
