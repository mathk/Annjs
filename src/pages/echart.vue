<template>
    <v-container grid-list-md fluid text-xs-center>
        <set-edge-node v-model="showAddInput" type="in" />
        <set-edge-node v-model="showAddOutput" type="out" />
        <set-layer-node v-model="showSetLayer" />
        <v-snackbar
            v-model="notificationEnable" top>
            {{ notificationText }}
            <v-btn color="pink" @click.native="notificationEnable = false">Close</v-btn>
        </v-snackbar>
        <v-layout row wrap>
            <v-flex xs8>
                <v-card ref="form" :height="'600px'" >
                    <v-toolbar color="gray">
                        <v-icon>mdi-chart-bubble</v-icon>
                    </v-toolbar>
                    <v-container fluid class="px-3">
                        <chart ref="chart" :autoResize="true" :options="options" :watch-shallow="false"></chart>
                    </v-container>
                </v-card>
            </v-flex>
            <v-flex xs4>
                <raw-input @input="runNetwork" :nodes="$store.state.input" class="mb-3" />
                <raw-input @input="setTarget" :nodes="$store.state.output" kind="Target" />
            </v-flex>
        </v-layout>
    </v-container>
</template>

<script>
import 'echarts';
import 'mdi/css/materialdesignicons.min.css';
import SetEdgeNode from '@/components/SetEdgeNode.vue';
import RawInput from '@/components/RawInput.vue';
import SetLayerNode from '@/components/SetLayerNodes.vue';
import eyeSlashIcon from '@/assets/raw-icon/eye-slash';
import eyeIcon from '@/assets/raw-icon/eye';
import eyeSolidSlashIcon from '@/assets/raw-icon/eye-slash-solid';
import eyeSolidIcon from '@/assets/raw-icon/eye-solid';
import plusCircle from '@/assets/raw-icon/plus-circle';
import plusSquare from '@/assets/raw-icon/plus-square';
import randomIcon from '@/assets/raw-icon/random';
import ECharts from 'vue-echarts/components/ECharts';
import _ from 'lodash';
import Color from 'color';

export default {
    data () {
        return {
            showEdgeLabel: true,
            showNodeLabel: true,
            showAddOutput: false,
            showAddInput: false,
            showSetLayer: false,
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
            let makeIconStyle = (color) => {
                return {
                    normal: {
                        color: color.rgb().toString(),
                        borderWidth: 0
                    },
                    emphasis: {
                        color: color.darken(0.3).saturate(0.3).rgb().toString(),
                        borderWidth: 0
                    }
                };
            };
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
                    iconStyle: makeIconStyle(Color.rgb(120, 120, 235)),
                    feature: {
                        myAddInputNode: {
                            show: true,
                            title: 'Set Input',
                            icon: plusSquare,
                            iconStyle: makeIconStyle(Color.rgb(50, 230, 85)),
                            onclick: () => {
                                this.showAddInput = true;
                            }
                        },
                        mySetLayer: {
                            show: true,
                            title: 'Set Layer',
                            icon: plusCircle,
                            onclick: () => {
                                this.showSetLayer = true;
                            }
                        },
                        mySetOutNode: {
                            show: true,
                            title: 'Set Output',
                            icon: plusSquare,
                            iconStyle: makeIconStyle(Color.rgb(50, 230, 235)),
                            onclick: () => {
                                this.showAddOutput = true;
                            }
                        },
                        myShowEdgeLabel: {
                            show: true,
                            title: 'Show Edge Label',
                            icon: this.showEdgeLabel ? eyeSlashIcon : eyeIcon,
                            iconStyle: makeIconStyle(Color.rgb(250, 100, 155)),
                            onclick: () => {
                                this.showEdgeLabel = !this.showEdgeLabel;
                            }
                        },
                        myShowNodeLabel: {
                            show: true,
                            title: 'Show Node Label',
                            icon: this.showNodeLabel ? eyeSolidSlashIcon : eyeSolidIcon,
                            iconStyle: makeIconStyle(Color.rgb(250, 100, 100)),
                            onclick: () => {
                                this.showNodeLabel = !this.showNodeLabel;
                            }
                        },
                        myRandomNet: {
                            show: true,
                            title: 'Randomize Weight and Bias',
                            icon: randomIcon,
                            iconStyle: makeIconStyle(Color.rgb(200, 200, 200)),
                            onclick: () => {
                                this.$store.commit('random');
                            }
                        }
                    }
                },
                dataZoom: [
                    {
                        type: 'slider',
                        show: true,
                        xAxisIndex: [0],
                        filterMode: 'none',
                        start: 0,
                        end: 100
                    },
                    {
                        type: 'slider',
                        show: true,
                        yAxisIndex: [0],
                        filterMode: 'none',
                        left: '93%',
                        start: 0,
                        end: 100
                    }],
                animation: false,
                series: [
                    {
                        type: 'graph',
                        width: 660,
                        draggable: true,
                        coordinateSystem: 'cartesian2d',
                        symbolSize: 40,
                        label: {
                            normal: {
                                show: this.showNodeLabel
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
        nodes () {
            let skip = {};
            return _.filter(_.map(this.$store.getters.nodes, (node) => {
                if (this.$store.getters.layerSize(node.layer) > 50) {
                    skip[node.layer] = skip.hasOwnProperty(node.layer) ? skip[node.layer] + 1 : 0;
                }
                if (skip[node.layer] && (skip[node.layer] % (this.$store.getters.layerSize(node.layer) / 5).toFixed()) !== 0) {
                    return false;
                }
                if (node.type !== 'inner') {
                    return this.graphEdgeNode(node);
                }
                return this.graphNode(node);
            }));
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
        RawInput,
        SetEdgeNode,
        SetLayerNode,
        chart: ECharts
    },
    mounted () {
        this.$refs.chart.resize({width: 680, height: 500});
    },
    methods: {
        coord ({row, layer, info}) {
            var nodesLength = this.$store.getters.layerSize(layer);
            return [layer, ((this.maxy - this.miny) / (nodesLength + 1)) * (row + 1) + this.miny];
        },
        graphEdgeNode (node) {
            return { id: node.id, name: node.info, symbolSize: 10, symbol: 'rect', value: this.coord(node), type: node.type };
        },
        graphNode (node) {
            return { id: node.id, name: node.info, value: this.coord(node), type: node.type };
        },
        runNetwork (values) {
            this.$store.dispatch('run', values);
        },
        setTarget (values) {
            this.$store.commit('setTarget', values);
        }
    }
};
</script>
