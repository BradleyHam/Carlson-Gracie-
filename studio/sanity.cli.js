import {defineCliConfig} from 'sanity/cli';
import {sanityConfig} from '../cms/config.js';
export default defineCliConfig({api:{projectId:process.env.SANITY_STUDIO_PROJECT_ID || sanityConfig.projectId || 'setup-required',dataset:process.env.SANITY_STUDIO_DATASET || sanityConfig.dataset},studioHost:'carlson-gracie-nz',deployment:{appId:'mevxlbyo6g3ghgxst3m1evvi'}});
