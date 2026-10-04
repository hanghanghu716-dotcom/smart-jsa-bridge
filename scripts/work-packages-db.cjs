// Run against isolated PostgreSQL, not production. PGLITE_MODULE may reference an external installation.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { PGlite } = require(process.env.PGLITE_MODULE || "@electric-sql/pglite");
(async () => {
  const db = new PGlite();
  await db.waitReady;
  const id = (n) => "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
  const actor = async (n) =>
    db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      n ? id(n) : "",
    ]);
  try {
    await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;create schema jsa_private;
 create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb default '{}');alter table storage.objects enable row level security;
 grant usage on schema public,auth,storage,jsa_private to anon,authenticated;grant select,insert,update,delete on storage.objects to anon,authenticated;
 insert into auth.users values('${id(1)}'),('${id(2)}');`);
    const migration = fs
      .readdirSync(path.join(__dirname, "../supabase/migrations"))
      .find((f) => f.endsWith("_private_work_packages.sql"));
    await db.exec(
      fs.readFileSync(
        path.join(__dirname, "../supabase/migrations", migration),
        "utf8",
      ),
    );
    await actor(1);
    await db.exec("set role authenticated");
    const originalPath = `${id(1)}/drawings/${id(10)}/source.pdf`,
      outputPath = `${id(1)}/outputs/${id(30)}/output.pdf`;
    await db.query(
      "insert into storage.objects(bucket_id,name,metadata) values('work-bundle-assets',$1,'{\"size\":100}')",
      [originalPath],
    );
    await db.query(
      "insert into work_drawings(id,name,object_path,mime_type,page_count,file_size,sha256) values($1,'Private drawing',$2,'application/pdf',2,100,$3)",
      [id(10), originalPath, "a".repeat(64)],
    );
    const drawingDoc = {
      id: "doc",
      type: "drawing",
      enabled: true,
      drawingId: id(10),
      pages: [1, 2],
      annotations: { 1: [{ type: "marker", x: 10, y: 20, text: "1" }] },
    };
    await db.query(
      "insert into work_packages(id,name,version_name,data) values($1,'Base','ver.1',$2)",
      [id(20), { documents: [drawingDoc] }],
    );
    await db.query(
      "insert into storage.objects(bucket_id,name,metadata) values('work-bundle-assets',$1,'{\"size\":100}')",
      [outputPath],
    );
    await db.query(
      "insert into work_outputs(id,package_id,name,snapshot,object_path,sha256,file_size) values($1,$2,'Old print',$3,$4,$5,100)",
      [
        id(30),
        id(20),
        {
          packageName: "Base",
          common: { workDate: "2026-10-02" },
          documents: [drawingDoc],
        },
        outputPath,
        "b".repeat(64),
      ],
    );
    await db.query(
      "update work_packages set name='Revised',data=$1 where id=$2",
      [{ documents: [] }, id(20)],
    );
    assert.equal(
      (await db.query("select snapshot from work_outputs")).rows[0].snapshot
        .packageName,
      "Base",
    );
    await assert.rejects(
      db.query("update work_outputs set name='Rewritten'"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("update work_drawings set revision='Changed'"),
      /permission denied/,
    );
    assert.equal(
      (await db.query("delete from storage.objects returning id")).rows.length,
      0,
    );
    await actor(2);
    for (const table of [
      "work_packages",
      "work_form_templates",
      "work_drawings",
      "work_outputs",
    ])
      assert.equal((await db.query(`select * from ${table}`)).rows.length, 0);
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        "insert into storage.objects(bucket_id,name,metadata) values('work-bundle-assets',$1,'{}')",
        [`${id(1)}/drawings/${id(12)}/source.pdf`],
      ),
      /row-level security/,
    );
    await assert.rejects(
      db.query(
        "insert into work_packages(name,data) values('Foreign drawing',$1)",
        [{ documents: [drawingDoc] }],
      ),
      /WORK_DRAWING_INVALID/,
    );
    await assert.rejects(
      db.query(
        "insert into work_packages(user_id,name,data) values($1,'Spoof','{\"documents\":[]}')",
        [id(1)],
      ),
      /WORK_OWNER_INVALID|row-level security/,
    );
    await assert.rejects(
      db.query(
        "insert into work_outputs(id,package_id,name,snapshot,object_path,sha256,file_size) values($1,$2,'Foreign package','{\"documents\":[]}',$3,$4,100)",
        [
          id(31),
          id(20),
          `${id(2)}/outputs/${id(31)}/output.pdf`,
          "c".repeat(64),
        ],
      ),
      /WORK_PACKAGE_INVALID/,
    );
    await actor(1);
    await assert.rejects(
      db.query("update work_packages set data=$1 where id=$2", [
        { documents: [{ ...drawingDoc, pages: [3] }] },
        id(20),
      ]),
      /WORK_PAGES_INVALID/,
    );
    // A broad future Storage policy must not make originals editable or cross-user accessible.
    await db.exec(
      "reset role;create policy broad_storage on storage.objects for all to anon,authenticated using(true) with check(true);set role authenticated",
    );
    await actor(1);
    assert.equal(
      (await db.query("update storage.objects set metadata='{}' returning id"))
        .rows.length,
      0,
    );
    assert.equal(
      (await db.query("delete from storage.objects returning id")).rows.length,
      0,
    );
    await actor(2);
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      0,
    );
    await db.exec("reset role;set role anon");
    await actor(null);
    await assert.rejects(
      db.query("select * from work_packages"),
      /permission denied/,
    );
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      0,
    );
    await db.exec('reset role');
    const usageMigration = fs.readdirSync(path.join(__dirname, '../supabase/migrations')).find(f => f.endsWith('_work_storage_summary.sql'));
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations', usageMigration), 'utf8'));
    await db.exec('set role authenticated');
    await actor(1);
    const usage = (await db.query('select public.work_storage_summary() as usage')).rows[0].usage;
    assert.equal(usage.files, 2); assert.equal(usage.bytes, 200); assert.equal(usage.unregisteredFiles, 0);
    await db.query("insert into storage.objects(bucket_id,name,metadata) values('work-bundle-assets',$1,'{\"size\":23}')", [id(1) + '/drawings/unregistered/source.png']);
    const pending = (await db.query('select public.work_storage_summary() as usage')).rows[0].usage;
    assert.equal(pending.unregisteredFiles, 1); assert.equal(pending.unregisteredBytes, 23);
    await actor(2);
    assert.equal((await db.query('select public.work_storage_summary() as usage')).rows[0].usage.bytes, 0);
    await db.exec('reset role; set role anon'); await actor(null);
    await assert.rejects(db.query('select public.work_storage_summary()'), /permission denied/);
    console.log('PASS: owner-scoped file totals, unregistered uploads and anonymous usage denial.');
    console.log(
      "PASS: package isolation, immutable originals/archives, private Storage, cross-owner references, impersonation, page bounds, and retained output snapshots.",
    );
  } finally {
    await db.close();
  }
})().catch((e) => {
  console.error(e.message, e.position ? `at SQL position ${e.position}` : "");
  process.exitCode = 1;
});
