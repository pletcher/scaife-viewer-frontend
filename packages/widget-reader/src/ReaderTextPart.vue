<template>
  <div
    class="reader-line"
    :class="{
      'playing-audio': playingAudio,
      'half-line-end': isHalfLineEnd,
    }"
  >
    <section class="tokens" v-if="interlinearMode">
      <ReaderToken v-for="token in tokens" :key="token.veRef" :token="token" />
    </section>
    <div class="line" v-else>
      <div class="line-ref" @click="onLineSelect">
        <Icon v-if="playingAudio" name="volume-up" />
        {{ textPart.ref }}
      </div>
      <div
        class="line-text metrical"
        v-if="metricalMode && metricalHtml"
        v-html="metricalHtml"
      />
      <div class="line-text" :class="{highlight: isTranscriptionHighlighted}" v-else>
        <ReaderToken
          v-for="token in tokens"
          :key="token.veRef"
          :token="token"
        />
      </div>
    </div>
  </div>
</template>

<script>
  import URN, { Icon } from '@scaife-viewer/common';
  import { MODULE_NS, SELECT_LINE } from '@scaife-viewer/store';
  import ReaderToken from './ReaderToken.vue';

  export default {
    props: ['textPart'],
    components: { Icon, ReaderToken },
    methods: {
      onLineSelect() {
        this.$store.dispatch(`${MODULE_NS}/${SELECT_LINE}`, {
          ref: this.textPart.ref,
        });
      },
    },
    computed: {
      urn() {
        return this.$route.params.urn ? new URN(this.$route.params.urn) : null;
      },
      playingAudio() {
        if (this.$store.state[MODULE_NS].nowPlaying === null) {
          return false;
        }
        const parts = this.$store.state[MODULE_NS].nowPlaying.split(':');
        const ref = parts[parts.length - 1];
        return this.textPart.ref === ref;
      },
      tokens() {
        return this.textPart.tokens;
      },
      interlinearMode() {
        return this.$store.getters[`${MODULE_NS}/interlinearMode`];
      },
      metricalHtml() {
        return (
          this.textPart.metricalAnnotations[0] &&
          this.textPart.metricalAnnotations[0].htmlContent
        );
      },
      metricalMode() {
        return this.$store.getters[`${MODULE_NS}/metricalMode`];
      },
      metrical() {
        return this.metricalMode && this.metricalHtml;
      },
      isHalfLineEnd() {
        // NOTE: This is our first attempt to provide
        // additional formatting to text parts based on
        // their kind and is subject to change.
        // In particular, it is not yet very extensible.
        const { kind } = this.textPart;
        if (!kind === 'half-line') {
          return false;
        }
        const refDepth = (this.textPart.ref.match(/\./g) || []).length;
        return refDepth === 3 ? this.textPart.ref.endsWith('2') : false;
      },
      isTranscriptionHighlighted() {
        const highlightedRef = this.$store.getters[`${MODULE_NS}/highlightedTranscription`];

        return highlightedRef === this.textPart.ref;
      },
    },
  };
</script>

<style lang="scss" scoped>
  .playing-audio {
    background: var(--sv-widget-reader-playing-audio-background, #e9ecef);
  }
  .line {
    display: flex;
    align-items: baseline;

    .highlight {
      background: var(
        --sv-widget-reader-token-selected-entity-shadow-color,
        #9f9
      );
    }
    .line-ref {
      font-size: 10pt;
      color: var(--sv-widget-reader-line-ref-text-color, #69c);
      font-family: var(--sv-widget-reader-line-ref-font-family, 'Noto Sans');
      min-width: 4em;
      margin-left: 1em;
      text-align: right;
      cursor: pointer;
      > svg {
        margin-left: -10px;
        margin-right: 10px;
        color: var(--sv-widget-reader-line-ref-svg-color, #495057);
      }
    }
    .line-text {
      margin-left: 1em;
    }
  }

  .half-line-end {
    .line-text {
      margin-inline-start: 5%;
      margin-block-end: 10px;
    }
  }

  .tokens {
    margin: 20px 0;
  }
</style>

<style lang="scss">
  .metrical {
    span.foot {
      box-sizing: border-box;
    }
    span.syll {
      box-sizing: border-box;
    }

    /* show foot and syllable divisions */

    li div {
      word-spacing: 0.6em;
    }
    span.syll {
      padding: 1px 3px;
    }
    span.syll:first-child {
      border-left: 2px solid
        var(--sv-widget-reader-metrical-syll-first-border-color, black);
    }
    span.syll.caesura:first-child {
      border-left: 3px solid
        var(--sv-widget-reader-metrical-syll-caesura-first-border-color, blue);
    }
    span.syll:not(:first-child) {
      border-left: 1px dotted
        var(--sv-widget-reader-metrical-syll-first-border-color, black);
    }
    span.syll.caesura:not(:first-child) {
      border-left: 3px dotted
        var(--sv-widget-reader-metrical-syll-caesura-first-border-color, blue);
    }

    /* show syllable length */
    span.syll.long {
      background-color: var(
        --sv-widget-reader-metrical-syll-long-border-color,
        #ccc
      );
    }
    span.syll:not(.long) {
      background-color: var(
        --sv-widget-reader-metrical-syll-not-long-border-color,
        #eee
      );
    }
  }
</style>
