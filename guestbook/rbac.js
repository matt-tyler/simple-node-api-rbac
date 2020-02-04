const casbin = require('casbin');

const model = `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && keyMatch2(r.obj, p.obj) && r.act == p.act
`

const policy = `
p, role:reader, /, read
p, role:writer, /, write
p, role:deleter, /, delete

g, role:deleter, role:writer
g, role:writer, role:reader
`

const enforcerPromise = casbin.newEnforcer(
    casbin.newModel(model),
    new casbin.StringAdapter(policy));

async function enforce(sub, obj, act) {
    const e = await enforcerPromise;
    return await e.enforce(sub, obj, act);
}

async function addRolesToUser(sub, roles) {
    const e = await enforcerPromise;
    await Promise.all(roles.map(role => e.addRoleForUser(sub, `role:${role}`)));
}

module.exports.enforce = enforce;
module.exports.addRolesToUser = addRolesToUser;
