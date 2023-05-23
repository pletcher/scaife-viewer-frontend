import gql from 'graphql-tag';
import URN from '@scaife-viewer/common';

import {
  MODULE_NS,
  ADD_LEFT_WIDGET,
  ADD_RIGHT_WIDGET,
  CHANGE_MAIN_WIDGET,
  REMOVE_LEFT_WIDGET,
  REMOVE_RIGHT_WIDGET,
  TOGGLE_LEFT_SIDEBAR,
  TOGGLE_RIGHT_SIDEBAR,
  CHANGE_SIDEBAR_VISIBILITY,
  SET_MAIN_LAYOUT_WIDTH_NORMAL,
  SET_MAIN_LAYOUT_WIDTH_WIDE,
  SET_MAIN_LAYOUT_WIDTH_WIDER,
  SET_SENSE_EXPANSION,
  SET_CITATION_DISPLAY,
  SELECT_NAMED_ENTITIES,
  CLEAR_NAMED_ENTITIES,
  HIGHLIGHT_TRANSCRIPTION,
  SET_TEXT_SIZE,
  SET_TEXT_WIDTH,
  SELECT_LINE,
  SELECT_TOKEN,
  CLEAR_TOKEN,
  SET_SELECTED_LEMMAS,
  SET_PASSAGE,
  UPDATE_METADATA,
  PLAY_AUDIO,
  STOP_AUDIO,
  FETCH_METADATA,
  FETCH_LIBRARY,
  DISPLAY_MODE_INTERLINEAR,
  DISPLAY_MODE_METRICAL,
  DISPLAY_MODE_DICTIONARY_ENTRIES,
  DISPLAY_MODE_NAMED_ENTITIES,
  DISPLAY_MODE_COMMENTARIES,
  DISPLAY_MODE_DEFAULT,
  SENSE_EXPANSION_PASSAGE,
  CITATION_DISPLAY_REFS_QUOTES,
  SET_SELECTED_DICTIONARY_OPTION,
  TOGGLE_READER_SYNC_COMMENTARY,
  SET_COMMENTARIES,
  SET_SELECTED_COMMENTARIES,
  CLEAR_SELECTED_COMMENTARIES,
  SHOW_TRANSLITERATION,
  SHOW_LEMMA,
  SHOW_RELATIONSHIP,
  SHOW_MORPH_TAG,
  SHOW_GRAMMATICAL_TAGS,
  SHOW_GLOSS,
  SELECT_GRAMMATICAL_ENTRIES,
  CLEAR_GRAMMATICAL_ENTRIES,
  DISPLAY_MODE_GRAMMATICAL_ENTRIES,
} from './constants';

const displayName = name => {
  const isCallable = typeof name === 'function';
  return isCallable ? name() : name;
};

const getDefaultState = () => ({
  rightOpen: true,
  leftOpen: true,
  leftVisible: true,
  rightVisible: true,
  widgets: {
    mainWidget: null,
    right: [],
    left: [],
  },
  mainLayoutFlexClass: 'main-layout-flex-2',
  metadata: null,
  passage: null,
  libraryTree: null,
  readerTextSize: 'md',
  readerTextWidth: 'normal',
  nowPlaying: null,
  highlightedTranscription: null,
  selectedLine: null,
  selectedToken: null,
  selectedNamedEntities: [],
  selectedGrammaticalEntries: [],
  // TODO: Add action to set selectedLemmas from selected token(s)
  selectedLemmas: [],
  senseExpansion: SENSE_EXPANSION_PASSAGE,
  citationDisplay: CITATION_DISPLAY_REFS_QUOTES,
  // TODO: Determine if we want to track state in the store or elsewhere
  // Could also impact interlinear
  // TODO: Make this state collection-scoped
  // (especially as far as gloss, which we may not always have)
  [SHOW_TRANSLITERATION]: false,
  [SHOW_LEMMA]: false,
  [SHOW_RELATIONSHIP]: true,
  [SHOW_MORPH_TAG]: false,
  [SHOW_GRAMMATICAL_TAGS]: false,
  [SHOW_GLOSS]: false,
  // TODO: More on storage of these toggles
  // TODO: Standardize labels (available vs resolved)
  showCitedLemmas: true,
  showAvailableLemmas: true,
  showMissingLemmas: true,
  selectedDictionaryOption: {
    title: 'All Dictionaries',
    value: null,
  },
  syncCommentary: false,
  selectedCommentaries: [],
  commentariesHash: {},
});

const createStore = client => {
  return {
    namespace: MODULE_NS,
    store: {
      namespaced: true,
      state: getDefaultState,
      getters: {
        metadata: state => state.metadata,
        passage: state => (state.passage ? new URN(state.passage) : null),
        firstPassageUrn: state =>
          state.metadata ? new URN(state.metadata.firstPassageUrn) : null,
        libraryTree: state => state.libraryTree,
        firstCitationSchemeLabel: (_, getters) => {
          return getters.metadata ? getters.metadata.citationScheme[0] : '';
        },
        highlightedTranscription: state => state.highlightedTranscription,
        interlinearMode: (_, getters) => {
          return getters.displayMode === DISPLAY_MODE_INTERLINEAR;
        },
        metricalMode: (_, getters) => {
          return getters.displayMode === DISPLAY_MODE_METRICAL;
        },
        dictionaryEntriesMode: (_, getters) => {
          return getters.displayMode === DISPLAY_MODE_DICTIONARY_ENTRIES;
        },
        namedEntitiesMode: (_, getters) => {
          return getters.displayMode === DISPLAY_MODE_NAMED_ENTITIES;
        },
        grammaticalEntriesMode: (_, getters) => {
          return getters.displayMode === DISPLAY_MODE_GRAMMATICAL_ENTRIES;
        },
        commentariesMode: (_, getters) => {
          return getters.displayMode === DISPLAY_MODE_COMMENTARIES;
        },
        urn: (state, getters, rootState) => {
          if (!rootState.route) {
            return getters.firstPassageUrn;
          }
          const { urn } = rootState.route.params;
          return urn ? new URN(urn) : getters.firstPassageUrn;
        },
        displayMode: (_, __, rootState) => {
          if (!rootState.route) {
            return DISPLAY_MODE_DEFAULT;
          }
          const { mode } = rootState.route.query;
          return mode || DISPLAY_MODE_DEFAULT;
        },
        selectedLemmas: state => state.selectedLemmas,
        selectedDictionaryUrn: state => state.selectedDictionaryOption.value,
        showCommentary: (_, __, rootState) => {
          const { commentary } = rootState.route.query;
          return commentary === 'y';
        },
      },
      mutations: {
        [SET_MAIN_LAYOUT_WIDTH_NORMAL]: state => {
          state.mainLayoutFlexClass = 'main-layout-flex-2';
        },
        [SET_MAIN_LAYOUT_WIDTH_WIDE]: state => {
          state.mainLayoutFlexClass = 'main-layout-flex-4';
        },
        [SET_MAIN_LAYOUT_WIDTH_WIDER]: state => {
          state.mainLayoutFlexClass = 'main-layout-flex-6';
        },
        [TOGGLE_LEFT_SIDEBAR]: state => {
          state.leftOpen = !state.leftOpen;
        },
        [TOGGLE_RIGHT_SIDEBAR]: state => {
          state.rightOpen = !state.rightOpen;
        },
        [ADD_LEFT_WIDGET]: (state, widget) => {
          state.widgets.left = [
            ...state.widgets.left,
            displayName(widget.scaifeConfig.displayName),
          ];
        },
        [ADD_RIGHT_WIDGET]: (state, widget) => {
          state.widgets.right = [
            ...state.widgets.right,
            displayName(widget.scaifeConfig.displayName),
          ];
        },
        [REMOVE_LEFT_WIDGET]: (state, index) => {
          const widgets = [...state.widgets.left];
          widgets.splice(index, 1);
          state.widgets.left = widgets;
        },
        [REMOVE_RIGHT_WIDGET]: (state, index) => {
          const widgets = [...state.widgets.right];
          widgets.splice(index, 1);
          state.widgets.right = widgets;
        },
        [CHANGE_MAIN_WIDGET]: (state, widget) => {
          state.widgets = {
            ...state.widgets,
            mainWidget: displayName(widget.scaifeConfig.displayName),
          };
        },
        [CHANGE_SIDEBAR_VISIBILITY]: (state, { side, bool }) => {
          if (side === 'left') {
            state.leftVisible = bool;
          }
          if (side === 'right') {
            state.rightVisible = bool;
          }
        },
        [SELECT_TOKEN]: (state, token) => {
          state.selectedToken = token;
        },
        [CLEAR_TOKEN]: state => {
          state.selectedToken = null;
        },
        [HIGHLIGHT_TRANSCRIPTION]: (state, ref) => {
          state.highlightedTranscription = ref;
          state.selectedLine = ref;
        },
        [SET_SELECTED_LEMMAS]: (state, { lemmas }) => {
          state.selectedLemmas = lemmas;
        },
        [SELECT_LINE]: (state, ref) => {
          state.highlightedTranscription = ref;
          state.selectedLine = ref;
        },
        [STOP_AUDIO]: state => {
          state.nowPlaying = null;
        },
        [PLAY_AUDIO]: (state, ref) => {
          state.nowPlaying = ref;
        },
        [SELECT_NAMED_ENTITIES]: (state, entities) => {
          state.selectedNamedEntities = entities;
        },
        [CLEAR_NAMED_ENTITIES]: state => {
          state.selectedNamedEntities = [];
        },
        [SELECT_GRAMMATICAL_ENTRIES]: (state, entries) => {
          state.selectedGrammaticalEntries = entries;
        },
        [CLEAR_GRAMMATICAL_ENTRIES]: state => {
          state.selectedGrammaticalEntries = [];
        },
        [FETCH_METADATA]: (state, metadata) => {
          state.metadata = metadata;
        },
        [FETCH_LIBRARY]: (state, libraryTree) => {
          state.libraryTree = libraryTree;
        },
        [SET_PASSAGE]: (state, urn) => {
          state.passage = urn;
        },
        [SET_TEXT_SIZE]: (state, size) => {
          state.readerTextSize = size;
        },
        [SET_TEXT_WIDTH]: (state, width) => {
          state.readerTextWidth = width;
        },
        [SET_SENSE_EXPANSION]: (state, value) => {
          state.senseExpansion = value;
        },
        [SET_CITATION_DISPLAY]: (state, value) => {
          state.citationDisplay = value;
        },
        [SET_SELECTED_DICTIONARY_OPTION]: (state, value) => {
          state.selectedDictionaryOption = value;
        },
        [TOGGLE_READER_SYNC_COMMENTARY]: state => {
          state.syncCommentary = !state.syncCommentary;
        },
        [SET_COMMENTARIES]: (state, lookup) => {
          state.commentariesHash = lookup;
        },
        [SET_SELECTED_COMMENTARIES]: (state, { commentaries }) => {
          state.selectedCommentaries = commentaries;
        },
        [CLEAR_SELECTED_COMMENTARIES]: state => {
          state.selectedCommentaries = [];
        },
      },
      actions: {
        [SET_MAIN_LAYOUT_WIDTH_NORMAL]: ({ commit }) => {
          commit(SET_MAIN_LAYOUT_WIDTH_NORMAL);
        },
        [SET_MAIN_LAYOUT_WIDTH_WIDE]: ({ commit }) => {
          commit(SET_MAIN_LAYOUT_WIDTH_WIDE);
        },
        [SET_MAIN_LAYOUT_WIDTH_WIDER]: ({ commit }) => {
          commit(SET_MAIN_LAYOUT_WIDTH_WIDER);
        },
        [TOGGLE_LEFT_SIDEBAR]: ({ commit }) => {
          commit(TOGGLE_LEFT_SIDEBAR);
        },
        [TOGGLE_RIGHT_SIDEBAR]: ({ commit }) => {
          commit(TOGGLE_RIGHT_SIDEBAR);
        },
        [ADD_LEFT_WIDGET]: ({ commit }, { widget }) => {
          commit(ADD_LEFT_WIDGET, widget);
        },
        [ADD_RIGHT_WIDGET]: ({ commit }, { widget }) => {
          commit(ADD_RIGHT_WIDGET, widget);
        },
        [REMOVE_LEFT_WIDGET]: ({ commit }, { index }) => {
          commit(REMOVE_LEFT_WIDGET, index);
        },
        [REMOVE_RIGHT_WIDGET]: ({ commit }, { index }) => {
          commit(REMOVE_RIGHT_WIDGET, index);
        },
        [CHANGE_MAIN_WIDGET]: ({ commit }, { widget }) => {
          commit(CHANGE_MAIN_WIDGET, widget);
        },
        [CHANGE_SIDEBAR_VISIBILITY]: ({ commit }, { side, bool }) => {
          commit(CHANGE_SIDEBAR_VISIBILITY, { side, bool });
        },
        [CLEAR_TOKEN]: ({ commit }) => {
          commit(CLEAR_TOKEN);
        },
        [HIGHLIGHT_TRANSCRIPTION]: ({ commit }, { ref }) => {
          commit(HIGHLIGHT_TRANSCRIPTION, ref);
        },
        [SELECT_TOKEN]: ({ commit }, { token }) => {
          commit(SELECT_TOKEN, token);
        },
        [SELECT_LINE]: ({ commit }, { ref }) => {
          commit(SELECT_LINE, ref);
        },
        [STOP_AUDIO]: ({ commit }) => {
          commit(STOP_AUDIO);
        },
        [PLAY_AUDIO]: ({ commit }, { ref }) => {
          commit(PLAY_AUDIO, ref);
        },
        [SELECT_NAMED_ENTITIES]: ({ commit }, { entities }) => {
          commit(SELECT_NAMED_ENTITIES, entities);
        },
        [CLEAR_NAMED_ENTITIES]: ({ commit }) => {
          commit(CLEAR_NAMED_ENTITIES);
        },
        [SELECT_GRAMMATICAL_ENTRIES]: ({ commit }, { entries }) => {
          commit(SELECT_GRAMMATICAL_ENTRIES, entries);
        },
        [CLEAR_GRAMMATICAL_ENTRIES]: ({ commit }) => {
          commit(CLEAR_GRAMMATICAL_ENTRIES);
        },
        [FETCH_METADATA]: ({ commit }) => {
          client
            .query({
              query: gql`
                {
                  versions(first: 1) {
                    edges {
                      node {
                        id
                        metadata
                      }
                    }
                  }
                }
              `,
            })
            .then(data =>
              commit(
                FETCH_METADATA,
                data.data.versions.edges.map(e => e.node.metadata).pop(),
              ),
            );
        },
        [UPDATE_METADATA]: ({ commit }, { urn }) => {
          client
            .query({
              query: gql`
          {
            versions(urn: "${urn}") {
              edges {
                node {
                  id
                  metadata
                }
              }
            }
          }
        `,
            })
            .then(data =>
              commit(
                FETCH_METADATA,
                data.data.versions.edges.map(e => e.node.metadata).pop(),
              ),
            );
        },
        // @@@ should this really be something within scaife-widgets?
        [FETCH_LIBRARY]: ({ commit }) => {
          client
            .query({
              query: gql`
                {
                  tree(urn: "urn:cts:", upTo: "version") {
                    tree
                  }
                }
              `,
            })
            .then(data => {
              const nid = data.data.tree.tree[0];
              const textGroupsTree = nid.children.reduce((a, b) => {
                return a.concat(b.children);
              }, []);
              commit(FETCH_LIBRARY, textGroupsTree);
            });
        },
        [SET_PASSAGE]: ({ commit }, { urn }) => {
          commit(SET_PASSAGE, urn);
        },
        [SET_TEXT_SIZE]: ({ commit }, { size }) => {
          commit(SET_TEXT_SIZE, size);
        },
        [SET_TEXT_WIDTH]: ({ commit }, { width }) => {
          commit(SET_TEXT_WIDTH, width);
        },
        [SET_SENSE_EXPANSION]: ({ commit }, { value }) => {
          commit(SET_SENSE_EXPANSION, value);
        },
        [SET_CITATION_DISPLAY]: ({ commit }, { value }) => {
          commit(SET_CITATION_DISPLAY, value);
        },
        [SET_SELECTED_DICTIONARY_OPTION]: ({ commit }, { value }) => {
          commit(SET_SELECTED_DICTIONARY_OPTION, value);
        },
        [TOGGLE_READER_SYNC_COMMENTARY]: ({ commit }) => {
          commit(TOGGLE_READER_SYNC_COMMENTARY);
        },
        [SET_COMMENTARIES]: ({ commit }, { lookup }) => {
          commit(SET_COMMENTARIES, lookup);
        },
        [SET_SELECTED_COMMENTARIES]: ({ commit }, { commentaries }) => {
          commit(SET_SELECTED_COMMENTARIES, { commentaries });
        },
        [CLEAR_SELECTED_COMMENTARIES]: ({ commit }) => {
          commit(CLEAR_SELECTED_COMMENTARIES, { commentaries: [] });
        },
      },
    },
  };
};

export default createStore;
