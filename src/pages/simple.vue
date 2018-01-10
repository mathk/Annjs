<template>
    <div ref="cy" id="cy" v-show="!showInput" >
        <v-dialog v-model="showInput" class="modal" max-width="500px">
            <v-form>
                <v-card>
                    <v-text-field @blur="finishInput" v-model="inputValue" :rules="[isNumeric]" />
                </v-card>
            </v-form>
        </v-dialog>
    </div>
</template>
<style scoped>
.modal {
    z-index: 99
}

#cy {
  height: 100%;
  width: 100%;
  position: relative;
  left: 0;
  top: 0;
}

#info {
  color: #c88;
  font-size: 1em;
  position: absolute;
  z-index: -1;
  left: 1em;
  top: 1em;
}

</style>
<script>
import Cytoscape from 'cytoscape';
import lin from 'linear-algebra';
import _ from 'lodash';

const {Matrix} = lin();

export default {
    mounted () {
        this.cy = Cytoscape({
            container: this.$refs.cy,
            boxSelectionEnabled: false,
            autounselectify: true,
            style: Cytoscape.stylesheet()
                    .selector('node')
                    .css({
                        'content': function (ele) {
                            if (ele.data().info) {
                                return ele.data().info;
                            }
                            if (ele.data().bias) {
                                return ele.data().bias;
                            }
                            return ele.id();
                        },
                        'text-valign': 'center',
                        'color': 'white',
                        'text-outline-width': 2,
                        'background-color': '#999',
                        'text-outline-color': '#999'
                    })
                    .selector('node[type != "inner"]')
                    .css({
                        'shape': 'rectangle'
                    })
                    .selector('edge')
                    .css({
                        'content': 'data(weight)',
                        'curve-style': 'bezier',
                        'target-arrow-shape': 'triangle',
                        'target-arrow-color': '#ccc',
                        'line-color': '#ccc',
                        'width': 1
                    })
                    .selector(':selected')
                    .css({
                        'background-color': 'black',
                        'line-color': 'black',
                        'target-arrow-color': 'black',
                        'source-arrow-color': 'black'
                    })
                    .selector('.faded')
                    .css({
                        'opacity': 0.25,
                        'text-opacity': 0
                    })
        });

        this.cy.on('tap', 'node', e => {
            var node = e.target;
            var neighborhood = node.neighborhood().add(node);

            this.cy.elements().addClass('faded');
            neighborhood.removeClass('faded');
        });

        this.cy.on('tap', e => {
            if (e.target === this.cy) {
                this.cy.elements().removeClass('faded');
            }
        });

        this.cy.startBatch();
        this.cy.add(_.map(this.$store.getters.nodes, node => { return {group: 'nodes', data: node, position: {x: 0, y: 0}}; }));
        this.cy.add(_.map(this.$store.getters.edges, edge => { return { group: 'edges', data: edge }; }));
        this.cy.endBatch();
        this.layout = this.cy.layout({name: 'breadthfirst', directed: true, padding: 10, nodeDimensionsIncludeLabels: true});
        this.layout.run();
        this.cy.on('cxttap', 'node[type = "in"]', (e) => {
            this.targetInputNode = e.target;
            this.showInput = true;
        });
    },
    computed: {
        output () {
            return this.$store.getters.compute(new Matrix([[1], [2]]));
        }
    },
    data () {
        return {
            cy: null,
            layout: null,
            showInput: false,
            inputValue: null,
            targetInputNode: null
        };
    },
    methods: {
        isNumeric (n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },
        finishInput () {
            if (this.targetInputNode) {
                this.$store.commit('input', {
                    id: this.targetInputNode.data().id,
                    value: parseFloat(this.inputValue)
                });
                this.cy.forceRender();
                /*
                this.cy.$('node[id="' + this.targetInputNode.data().id + '"]')
                    .data(this.$store.getters.getNode(this.targetInputNode.data().id));
                */
            }
        }
    }
};
</script>
