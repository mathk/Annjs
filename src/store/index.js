import Vue from 'vue';
import Vuex from 'vuex';
import lin from 'linear-algebra';
import _ from 'lodash';

Vue.use(Vuex);

const { Matrix } = lin();
export default new Vuex.Store({
    state: {
        input: [
            {id: 'in0', row: 0, layer: -1, type: 'in', info: 'in0'},
            {id: 'in1', row: 1, layer: -1, type: 'in', info: 'in1'}
        ],
        layers: [{
            weight: new Matrix([[1, 2], [2, 1]]),
            bias: new Matrix([[2], [0.5]])
        }, {
            weight: new Matrix([[0.2, 1], [1, 1], [2, 3]]),
            bias: new Matrix([[2], [1], [1]])
        }],
        output: [
            {id: 'out0', row: 0, layer: 2, type: 'out', info: 'out0'},
            {id: 'out1', row: 1, layer: 2, type: 'out', info: 'out1'},
            {id: 'out2', row: 2, layer: 2, type: 'out', info: 'out2'}
        ]
    },
    getters: {
        inputVector (state) {
            return new Matrix(_.map(state.input, ({value}) => {
                return [value];
            }));
        },
        compute (state) {
            return (input) => {
                return state.layers.reduce((inL, l) => {
                    return l.weight.dot(inL).plus(l.bias).sigmoid();
                }, input).data;
            };
        },
        getNode (state, getters) {
            return (id) => {
                return _.find(getters.nodes, {id});
            };
        },
        layerSize (state, getters) {
            return (id) => {
                if (id < -1 || id > state.layers.length) {
                    throw new Error('Id out of bounds');
                }
                if (id === -1) {
                    return state.input.length;
                }
                if (id === state.layers.length) {
                    return state.output.length;
                }

                return state.layers[id].bias.data.length;
            };
        },
        layersIds (state) {
            return _.range(-1, state.layers.length);
        },
        innerLayersId (state) {
            return _.range(0, state.layers.length - 1);
        },
        nodes (state) {
            return _.concat(state.input, state.output, _.flatMapDeep(state.layers, (l, li) => {
                return _.map(l.bias.data, ([ bias ], ri) => {
                    return {id: 'innerL' + li + 'R' + ri, row: ri, layer: li, bias, type: 'inner', info: bias};
                });
            }));
        },
        edges (state, getters) {
            var id = -1;
            var outEdge = _.map(state.output, currentNode => {
                var innerNode = _.find(getters.nodes, {layer: state.layers.length - 1, row: currentNode.row});
                return { source: innerNode.id, target: currentNode.id, name: '1' };
            });
            return _.concat(_.flatMap(state.layers, (l, li) => {
                return _.flatMap(l.bias.data, (e, ri) => {
                    var currentNode = _.find(getters.nodes, {row: ri, layer: li});
                    return _.flatMap(_.filter(getters.nodes, {layer: li - 1}), node => {
                        id++;
                        return { source: node.id, target: currentNode.id, id, name: l.weight.data[currentNode.row][node.row].toFixed(2) };
                    });
                });
            }), outEdge);
        }
    },
    mutations: {
        addInuptNode (state, {weights, id}) {
            if (_.find(state.input, {id})) {
                throw new Error('Id is already taken.');
            }
            var matx = state.layers[0].weight;
            if (weights.length !== matx.rows) {
                throw new Error('Weights length does not correspond to the first layers. Need: ' + matx.row + ' values');
            }
            var newData = matx.data;
            _.each(newData, (row, id) => {
                row.push(weights[id]);
            });

            state.layers[0].weight = new Matrix(newData);
            state.input.push({id, row: state.input.length, layer: -1, type: 'in', info: id});
        },
        addNode (state, {inputWeight, bias, outputWeight, layerId}) {
            if (outputWeight && outputWeight.length > 0 && layerId === state.layers.length - 1) {
                throw new Error('output weight must not be set for the output layer.');
            }
            if (layerId < 0 || layerId >= state.layers.length) {
                throw new Error('Layers id is not in range.');
            }

            var currentLayer = state.layers[layerId];
            if (inputWeight.length !== currentLayer.weight.cols) {
                throw new Error('input weight length should match the node previous node length.');
            }
            var newWeight = currentLayer.weight.data;
            newWeight.push(inputWeight);
            var newBias = currentLayer.bias.data;
            newBias.push([bias]);
            currentLayer.weight = new Matrix(newWeight);
            currentLayer.bias = new Matrix(newBias);
            if (outputWeight.length > 0) {
                var nextLayer = state.layers[layerId + 1];
                if (nextLayer.weight.rows !== outputWeight.length) {
                    throw new Error('output weight does not meet the next layer node.');
                }
                var newData = nextLayer.weight.data;
                _.each(newData, (row, id) => {
                    row.push(outputWeight[id]);
                });
                nextLayer.weight = new Matrix(newData);
            }
        },
        inputs (state, input) {
            _.each(input, (value, id) => {
                var node = _.find(state.input, {id});
                if (node) {
                    Vue.set(node, 'value', value);
                    node.info = node.id + ': ' + value;
                }
            });
        },
        outputs (state, output) {
            _.each(output, (value, id) => {
                var node = _.find(state.output, {row: id});
                if (node) {
                    Vue.set(node, 'value', value[0]);
                    node.info = node.id + ': ' + value[0].toFixed(2);
                }
            });
        }
    },
    actions: {
        run ({getters, commit}, input) {
            commit('inputs', input);
            var outVector = getters.compute(getters.inputVector);
            commit('outputs', outVector);
        }
    }
});

