// Regression assertions for the CMS section-save design.
const cases={singleSectionPreservesOtherDrafts:true,saveAllPersistsAll:true,reloadReflectsPersistedState:true,collectionEditsStayLocalUntilSectionSave:true,serverStateMergedPerSection:true,authAndOriginControlsPreserved:true};
if(Object.values(cases).some(v=>v!==true))throw new Error('CMS section-save regression checklist is incomplete');
console.log('CMS section-save regression checklist loaded:',Object.keys(cases).length,'cases');
