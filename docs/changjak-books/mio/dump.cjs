const j=require(require('path').join(__dirname,'_scenes.json'));
for(const v of process.argv.slice(2)){
  console.log('\n================ 권 '+v+' ================');
  for(const [pg,t] of Object.entries(j[v]||{})){
    console.log('--- '+pg+'\n  '+String(t).replace(/<br\/>/g,'\n  ').replace(/<\/?b>/g,''));
  }
}
