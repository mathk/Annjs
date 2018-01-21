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
        sqrError (state) {
            let output = _.map(state.output, 'value');
            if (state.target && _.every(output, Number.isFinite)) {
                return _.sum(_.zipWith(output, state.target, (o, t) => Math.pow(o - t, 2)));
            }
            return 0;
        },
        compute (state) {
            return (input) => {
                return state.layers.reduce(([inL, ...rest], l) => {
                    return [l.weight.dot(inL).plus(l.bias).sigmoid(), inL, ...rest];
                }, [input]).reverse();
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
            return _.concat(state.input, state.output, _.flatMapDeep(state.layers, (l, layer) => {
                return _.map(l.bias.data, ([ bias ], row) => {
                    let info = bias.toFixed(2);
                    if (l.values && l.values[row]) {
                        info += '\nout: ' + l.values[row].toFixed(2);
                    }
                    return {id: 'innerL' + layer + 'R' + row, row, layer, bias, type: 'inner', info};
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
        setInputNodes (state, count) {
            let newData = _.times(state.layers[0].weight.rows, () => _.times(count, Math.random));
            state.layers[0].weight = new Matrix(newData);

            state.input = _.times(count, (id) => {
                return {id: 'in' + id, row: id, layer: -1, type: 'in', info: 'in' + id};
            });
        },
        setLayer (state, {count, layer}) {
            if (!state.layers[layer]) {
                throw new Error('Layer does not exist');
            }

            let newWeight = _.times(count, () => _.times(state.layers[layer].weight.cols, Math.random));
            let newBias = _.times(count, Math.random);

            state.layers.splice(layer, 1, {
                weight: new Matrix(newWeight),
                bias: Matrix.reshapeFrom(newBias, count, 1)
            });
            let nextLayer = state.layers[layer + 1];
            if (nextLayer) {
                let newNextWeight = _.times(nextLayer.weight.rows, () => _.times(count, Math.random));
                state.layers.splice(layer + 1, 1, {
                    weight: new Matrix(newNextWeight),
                    bias: nextLayer.bias
                });
            }
        },
        setOutputNodes (state, count) {
            let last = _.last(state.layers);
            let newWeight = _.times(count, () => _.times(last.weight.cols, Math.random));
            let newBias = _.times(count, Math.random);
            state.layers.splice(state.layers.length - 1, 1, {
                weight: new Matrix(newWeight),
                bias: Matrix.reshapeFrom(newBias, count, 1)
            });
            state.output = _.times(count, (id) => {
                return {id: 'out' + id, row: id, layer: state.layers.length, type: 'out', info: 'out' + id};
            });
            if (state.target) {
                delete state.target;
            }
        },
        setEdgeValue (state, {values, type}) {
            _.each(values, (value, id) => {
                var node = _.find(type === 'out' ? state.output : state.input, {row: id});
                if (node) {
                    Vue.set(node, 'output', value);
                    node.info = node.id + ': ' + value.toFixed(2);
                }
            });
        },
        setLayerValue (state, {values, layer}) {
            Vue.set(state.layers[layer], 'values', values);
        },
        setTarget (state, values) {
            console.log(values);
            if (state.output.length !== values.length) {
                throw new Error('Target values should be of the same length.');
            }
            Vue.set(state, 'target', values);
        },
        updateError (state) {
            if (state.target) {
            }
        },
        random (state) {
            _.each(state.layers, ({bias, weight}, i) => {
                state.layers[i].bias = Matrix.reshapeFrom(_.times(bias.rows, () => _.random(0, 1, true)), bias.rows, 1);
                state.layers[i].weight = Matrix.reshapeFrom(_.times(weight.rows * weight.cols, () => _.random(0, 1, true)), weight.rows, weight.cols);
            });
        }
    },
    actions: {
        run ({getters, commit}, input) {
            console.log(input);
            var [inputValues, ...inner] = getters.compute(Matrix.reshapeFrom(input, input.length, 1));
            commit('setEdgeValue', {values: _.flatten(inputValues.data), type: 'in'});
            commit('setEdgeValue', {values: _.flatten(_.last(inner).data), type: 'out'});
            _.each(_.initial(inner), (value, id) => {
                commit('setLayerValue', {values: _.flatten(value.data), layer: id});
            });
            commit('updateError');
        }
    }
});

