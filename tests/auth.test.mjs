import test from 'node:test';
import assert from 'node:assert/strict';
import {loginSchema,recuperaPasswordSchema,nuovaPasswordSchema} from '../src/lib/auth/schemas.ts';
test('accesso: email e codice iscritto restano entrambi utilizzabili',()=>{
 for(const email of ['utente@example.test','OD-0012'])assert.equal(loginSchema.safeParse({email,password:'password-demo'}).success,true);
 const parsed=loginSchema.parse({email:' OD-0012 ',password:'password-demo'});assert.equal(parsed.email,'OD-0012');
});
test('accesso: credenziali vuote e identificativi eccessivi vengono respinti',()=>{
 for(const data of [{email:' ',password:'demo'},{email:'OD-0012',password:''},{email:'a'.repeat(201),password:'demo'}])assert.equal(loginSchema.safeParse(data).success,false);
});
test('recupero: un codice iscritto non sostituisce una casella email',()=>{
 assert.equal(recuperaPasswordSchema.safeParse({email:'utente@example.test'}).success,true);
 for(const email of ['OD-0012','senza-chiocciola',''])assert.equal(recuperaPasswordSchema.safeParse({email}).success,false);
});
test('nuova password: richiede lunghezza minima e conferma coincidente',()=>{
 assert.equal(nuovaPasswordSchema.safeParse({password:'demo-1234',confermaPassword:'demo-1234'}).success,true);
 for(const data of [{password:'corta',confermaPassword:'corta'},{password:'demo-1234',confermaPassword:'diversa-5678'}])assert.equal(nuovaPasswordSchema.safeParse(data).success,false);
 const mismatch=nuovaPasswordSchema.safeParse({password:'demo-1234',confermaPassword:'diversa-5678'});assert.deepEqual(mismatch.error.issues[0].path,['confermaPassword']);
});
