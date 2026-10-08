import { supabase } from "../supabaseClient";
import { cleanPackage, uid } from "../utils/workPackages";
const bucket = "work-bundle-assets";
const pendingUploads = new WeakMap();
export async function workUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw Error("AUTH_REQUIRED");
  return user;
}
async function result(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
export async function listWorkData(table, columns = "*", page = 0) {
  const user = await workUser();
  return result(
    supabase
      .from(table)
      .select(columns)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .order("id")
      .range(page * 50, page * 50 + 49),
  );
}
export async function getWorkPackage(id) {
  const user = await workUser();
  return result(
    supabase
      .from("work_packages")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
  );
}
export async function getWorkOutput(id) {
  const user = await workUser();
  return result(
    supabase
      .from("work_outputs")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
  );
}
export async function saveWorkPackage(record) {
  const user = await workUser(),
    payload = {
      name: record.name.trim(),
      version_name: record.version_name.trim(),
      data: cleanPackage(record.data),
      user_id: user.id,
    };
  if (!record.id)
    return result(
      supabase.from("work_packages").insert(payload).select().single(),
    );
  const rows = await result(
    supabase
      .from("work_packages")
      .update(payload)
      .eq("id", record.id)
      .eq("user_id", user.id)
      .eq("updated_at", record.updated_at)
      .select(),
  );
  if (!rows.length) throw Error("WORK_CONFLICT");
  return rows[0];
}
export async function saveFormTemplate(doc) {
  const user = await workUser();
  return result(
    supabase
      .from("work_form_templates")
      .insert({
        user_id: user.id,
        name: doc.title,
        data: cleanPackage({ documents: [doc] }).documents[0],
      })
      .select()
      .single(),
  );
}
export async function hashBlob(blob) {
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()),
    ),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
async function uploadOnce(path, blob, expectedHash) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { contentType: blob.type, upsert: false });
  if (!error) return;
  const duplicate = String(error.statusCode) === "409" ||
    ["ResourceAlreadyExists", "Duplicate"].includes(error.code) ||
    /^(The resource already exists|Asset Already Exists)$/i.test(error.message || "");
  if (!duplicate) throw error;
  // An interrupted response can leave the upload completed. Reuse it only after
  // verifying the stored bytes; never attach new metadata to a different file.
  const stored = await assetBlob(path);
  if (stored.size !== blob.size || await hashBlob(stored) !== expectedHash)
    throw Error("WORK_UPLOAD_MISMATCH");
}
export async function uploadDrawing(file, meta, pageCount) {
  const user = await workUser();
  if (!pendingUploads.has(file)) pendingUploads.set(file, uid());
  const id = pendingUploads.get(file);
  const ext = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
  }[file.type];
  if (!ext || file.size > 20 * 1024 * 1024 || pageCount < 1 || pageCount > 200)
    throw Error("WORK_FILE_INVALID");
  const object_path = `${user.id}/drawings/${id}/source.${ext}`,
    sha256 = await hashBlob(file);
  await uploadOnce(object_path, file, sha256);
  const { data, error } = await supabase
    .from("work_drawings")
    .insert({
      id,
      user_id: user.id,
      name: meta.name,
      drawing_number: meta.number,
      revision: meta.revision,
      object_path,
      mime_type: file.type,
      page_count: pageCount,
      file_size: file.size,
      sha256,
    })
    .select()
    .single();
  if (error) {
    const existing = await result(
      supabase
        .from("work_drawings")
        .select()
        .eq("id", id)
        .eq("sha256", sha256)
        .maybeSingle(),
    );
    if (existing) return existing;
    throw error;
  }
  return data;
}
export async function assetBlob(path) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw error;
  return data;
}
export async function archiveWorkOutput(id, run, pdf, drawings) {
  const user = await workUser(),
    sha256 = await hashBlob(pdf),
    object_path = `${user.id}/outputs/${id}/output.pdf`;
  if (pdf.size > 40 * 1024 * 1024) throw Error("WORK_OUTPUT_LARGE");
  await uploadOnce(object_path, pdf, sha256);
  const snapshot = {
    ...structuredClone(run),
    drawings: drawings
      .filter((d) =>
        run.documents.some(
          (doc) => doc.type === "drawing" && doc.drawingId === d.id,
        ),
      )
      .map((d) => ({
        id: d.id,
        name: d.name,
        drawing_number: d.drawing_number,
        revision: d.revision,
        object_path: d.object_path,
        sha256: d.sha256,
      })),
  };
  const { data, error } = await supabase
    .from("work_outputs")
    .insert({
      id,
      user_id: user.id,
      package_id: run.packageId,
      name: `${run.packageName} · ${run.version}`.slice(0, 180),
      snapshot,
      object_path,
      sha256,
      file_size: pdf.size,
    })
    .select("id,name,object_path,created_at")
    .single();
  if (error) {
    const existing = await result(
      supabase
        .from("work_outputs")
        .select("id,name,object_path,created_at")
        .eq("id", id)
        .eq("sha256", sha256)
        .maybeSingle(),
    );
    if (existing) return existing;
    throw error;
  }
  return data;
}
export async function ownJsaList() {
  const user = await workUser();
  return result(
    supabase
      .from("jsa_projects")
      .select("id,title,updated_at")
      .eq("author_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(200),
  );
}
export async function ownJsa(id) {
  const user = await workUser();
  return result(
    supabase
      .from("jsa_projects")
      .select("id,title,form_data,analysis_data,custom_layout")
      .eq("id", id)
      .eq("author_id", user.id)
      .single(),
  );
}
