<template>
    <v-container grid-list-md fluid text-xs-center>
        <v-snackbar
            v-model="notificationEnable" top>
            {{ notificationText }}
            <v-btn color="pink" @click.native="notificationEnable = false">Close</v-btn>
        </v-snackbar>
        <v-layout row wrap>
            <v-flex xs8>
                <v-card ref="form">
                    <v-toolbar color="red lighten-1">
                        <v-icon>mdi-chart-bubble</v-icon>
                    </v-toolbar>
                    <v-container fluid class="px-3">
                        <chart :options="options" :watch-shallow="false"></chart>
                    </v-container>
                </v-card>
            </v-flex>
            <v-flex xs4>
                <v-card ref="form">
                    <v-toolbar color="red lighten-1">
                        <v-icon>fa-keyboard-o</v-icon>
                    </v-toolbar>
                    <v-container fluid class="px-3">
                        <v-layout row wrap>
                            <v-flex
                                xs12
                                v-for="node in inputNodes"
                                :key="node.id">
                                <v-text-field
                                    :label="'Input for id ' + node.id"
                                    v-model.number="inputValues[node.id]"
                                ></v-text-field>
                            </v-flex>
                        </v-layout>
                    </v-container>
                    <v-card-actions>
                        <v-btn @click="updateInput" color="red lighten-3">Update</v-btn>
                    </v-card-actions>
                </v-card>
            </v-flex>
        </v-layout>
    </v-container>
</template>

<script>
import 'echarts';
import 'mdi/css/materialdesignicons.min.css';
import eyeSlashIcon from '!raw-loader!../assets/raw-icon/eye-slash';
import eyeIcon from '!raw-loader!../assets/raw-icon/eye';
import eyeSolidSlashIcon from '!raw-loader!../assets/raw-icon/eye-slash-solid';
import eyeSolidIcon from '!raw-loader!../assets/raw-icon/eye-solid';
import plusCircle from '!raw-loader!../assets/raw-icon/plus-circle';
import plusSquare from '!raw-loader!../assets/raw-icon/plus-square';
import ECharts from 'vue-echarts/components/ECharts';
import _ from 'lodash';

export default {
    data () {
        return {
            showEdgeLabel: true,
            inputValues: {},
            notificationText: '',
            notificationEnable: false
        };
    },
    computed: {
        maxNodesPerLayer () {
            return _.max(_.map(this.$store.getters.layersIds, (idx) => this.$store.getters.layerSize(idx)));
        },
        layersCount () {
            return this.$store.getters.layersIds.length;
        },
        options () {
            return {
                renderer: 'svg',
                xAxis: {
                    show: false,
                    nameGap: 0,
                    type: 'value',
                    min: this.minx,
                    max: this.maxx
                },
                yAxis: {
                    show: false,
                    nameGap: 0,
                    type: 'value',
                    min: this.miny,
                    max: this.maxy
                },
                tooltip: {},
                toolbox: {
                    right: '20%',
                    itemSize: 25,
                    itemGap: 15,
                    iconStyle: {
                        normal: {
                            color: '#ef9a9a',
                            borderWidth: 0
                        },
                        emphasis: {
                            color: 'red',
                            borderWidth: 0
                        }
                    },
                    feature: {
                        myAddInputNode: {
                            show: true,
                            title: 'Add Input',
                            icon: plusSquare,
                            onclick: () => {
                                this.notificationText = 'ADD INPUT';
                                this.notificationEnable = true;
                            }
                        },
                        myAddNode: {
                            show: true,
                            title: 'Add node',
                            icon: plusCircle,
                            onclick: () => {
                                this.$store.commit('addInuptNode', {weights: [1, 2], id: 'test1'});
                                this.notificationText = 'TEST';
                                this.$store.commit('addNode', {layerId: 0, bias: 0.5, inputWeight: [1, 2, 3], outputWeight: [2, 3, 4]});
                                this.notificationEnable = true;
                            }
                        },
                        myShowEdgeLabel: {
                            show: true,
                            title: 'Show Edge Label',
                            icon: this.showEdgeLabel ? eyeSlashIcon : eyeIcon,
                            onclick: () => {
                                this.showEdgeLabel = !this.showEdgeLabel;
                            }
                        },
                        myShowNodeLabel: {
                            show: true,
                            title: 'Show Node Label',
                            icon: this.showEdgeLabel ? eyeSolidSlashIcon : eyeSolidIcon,
                            onclick: () => {
                            }
                        }
                    }
                },
                dataZoom: [
                    {
                        type: 'slider',
                        show: true,
                        xAxisIndex: [0],
                        start: 0,
                        end: 100
                    },
                    {
                        type: 'slider',
                        show: true,
                        yAxisIndex: [0],
                        left: '93%',
                        start: 0,
                        end: 100
                    }],
                animation: false,
                series: [
                    {
                        type: 'graph',
                        draggable: true,
                        coordinateSystem: 'cartesian2d',
                        symbolSize: 40,
                        label: {
                            normal: {
                                show: true
                            }
                        },
                        edgeLabel: {
                            normal: {
                                show: this.showEdgeLabel,
                                formatter (e) {
                                    return e.data.name;
                                }
                            }
                        },
                        edgeSymbol: ['circle', 'arrow'],
                        edgeSymbolSize: [4, 10],
                        tooltip: {
                            formatter (e) {
                                if (e.data.value) {
                                    return e.data.value[3] || e.data.name;
                                }
                                return e.data.name;
                            }
                        },
                        data: this.nodes,
                        links: this.edges
                    }
                ]
            };
        },
        inputNodes () {
            return _.filter(this.nodes, {type: 'in'});
        },
        nodes () {
            return _.map(this.$store.getters.nodes, (node) => {
                if (node.type !== 'inner') {
                    return this.graphEdgeNode(node);
                }
                return this.graphNode(node);
            });
        },
        edges () {
            return this.$store.getters.edges;
        },
        minx () {
            return -1;
        },
        miny () {
            return -1;
        },
        maxx () {
            return this.layersCount;
        },
        maxy () {
            return this.maxNodesPerLayer;
        }
    },
    components: {
        chart: ECharts
    },
    watch: {
        inputNodes () {
            this.bindInput();
        }
    },
    mounted () {
        this.bindInput();
    },
    methods: {
        updateInput () {
            this.$store.dispatch('run', this.inputValues);
        },
        bindInput () {
            this.inputValues = {};
            _.each(this.inputNodes, ({id}) => {
                this.$set(this.inputValues, id, null);
            });
        },
        coord ({row, layer, info}) {
            var nodesLength = this.$store.getters.layerSize(layer);
            return [layer, ((this.maxy - this.miny) / (nodesLength + 1)) * (row + 1) + this.miny];
        },
        graphEdgeNode (node) {
            return { id: node.id, name: node.info, symbol: 'rect', value: this.coord(node), type: node.type };
        },
        graphNode (node) {
            return { id: node.id, name: node.bias, value: this.coord(node), type: node.type };
        }
    }
};
</script>
