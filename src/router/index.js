import Vue from 'vue';
import Router from 'vue-router';
import Hello from '@/components/Hello';
import Simple from '@/pages/simple';
import Echart from '@/pages/echart';
import Image from '@/pages/image';

Vue.use(Router);

export default new Router({
    routes: [
        {
            path: '/',
            name: 'Hello',
            component: Hello
        },
        {
            path: '/simple',
            name: 'SimpleAnn',
            component: Simple
        },
        {
            path: '/echart',
            name: 'echart',
            component: Echart
        },
        {
            path: '/image',
            name: 'image',
            component: Image
        }
    ]
});
