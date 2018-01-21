<template>
    <v-card ref="form">
        <v-toolbar color="gray" flat dense>
            <v-icon>fa-keyboard-o</v-icon>
        </v-toolbar>
        <v-container fluid class="px-3">
            <v-layout row wrap>
                <v-flex
                    xs12
                    v-if="showInput"
                    v-for="node in nodes"
                    :key="node.id">
                    <v-text-field
                        :label="kind + ' for id ' + node.id"
                        v-model.number="values[node.row].value"
                    ></v-text-field>
                </v-flex>
                <v-flex
                    v-if="!showInput"
                    xs12>
                    <v-alert color="warning" icon="priority_high" value="true">
                        Raw input is not suitable for many input.
                    </v-alert>
                </v-flex>
            </v-layout>
        </v-container>
        <v-card-actions>
            <v-btn :enable="showInput" @click="updateInput" color="red lighten-3">Update</v-btn>
        </v-card-actions>
    </v-card>
</template>

<script>
import _ from 'lodash';

export default {
    props: {
        kind: {
            type: String,
            default: 'Input'
        },
        nodes: {
            type: Array,
            default: () => []
        }
    },
    data () {
        return {
            values: _.sortBy(_.map(this.nodes, (node) => Object.assign({value: null}, node)), ['row'])
        };
    },
    computed: {
        showInput () {
            return this.nodes.length < 10 && this.values.length > 0;
        }
    },
    watch: {
        nodes () {
            this.bindInput();
        }
    },
    methods: {
        bindInput () {
            this.values = _.sortBy(_.map(this.nodes, (node) => Object.assign({value: null}, node)), ['row']);
        },
        updateInput () {
            this.$emit('input', _.map(this.values, 'value'));
        }
    }
};
</script>
