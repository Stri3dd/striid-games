import {DatabaseSync} from 'node:sqlite';
// A small adapter for local development and endpoint tests, never deployed.
export function localDatabase(filename=':memory:'){
 const sqlite=new DatabaseSync(filename);
 const result=(sql,params,kind)=>{const statement=sqlite.prepare(sql);if(kind==='first')return statement.get(...params)||null;if(kind==='run'){const meta=statement.run(...params);return {success:true,meta:{changes:meta.changes}}}return {success:true,results:statement.all(...params)}};
 const prepared=(sql,params=[])=>({bind:(...p)=>prepared(sql,p),first:async()=>result(sql,params,'first'),run:async()=>result(sql,params,'run'),all:async()=>result(sql,params,'all'),_run:()=>result(sql,params,/^\s*(SELECT|WITH)/i.test(sql)?'all':'run')});
 return {prepare:prepared,batch:async statements=>{sqlite.exec('BEGIN');try{const results=statements.map(s=>s._run());sqlite.exec('COMMIT');return results}catch(error){sqlite.exec('ROLLBACK');throw error}},close:()=>sqlite.close()};
}
