<template>
   <v-dialog v-model="value" max-width="500px">
       <v-card>
           <v-toolbar color="gray">
               <v-icon>fa-cubes</v-icon>
           </v-toolbar>
           <v-card-text>
               <v-form v-model="validAddInput">
                   <v-text-field
                       :label="label"
                       v-model.numeric="count"
                       required />
               </v-form>
           </v-card-text>
           <v-card-actions>
               <v-btn flat color="red lighten-4" @click="close">Close</v-btn>
               <v-btn color="red lighten-3" @click="addEdge">Add</v-btn>
           </v-card-actions>
       </v-card>
   </v-dialog>
</template>
<script>
export default {
    props: {
        value: {
            type: Boolean,
            default: false
        },
        type: {
            type: String,
            default: 'in'
        }
    },
    data () {
        return {
            count: 0,
            validAddInput: false
        };
    },
    computed: {
        label () {
            return 'Number of ' + this.type === 'in' ? 'input' : 'output';
        }
    },
    methods: {
        addEdge () {
            if (this.type === 'in') {
                this.$store.commit('setInputNodes', this.count);
            } else {
                this.$store.commit('setOutputNodes', this.count);
            }
            this.$emit('input', false);
        },
        close () {
            this.$emit('input', false);
        }
    }
};
</script>
