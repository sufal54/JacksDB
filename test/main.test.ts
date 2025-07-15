import { JacksDB, Schema } from "../src/index";
import assert from "node:assert";

(async function testDB() {
  // 1. Define the schema for the collection
  const userSchema = new Schema({
    id: Number,
    name: String,
    age: Number,
    tags: [String],
    meta: {
      city: String,
      active: Boolean,
    },
  });

  // 2. Create JacksDB instance
  const db = new JacksDB("secret-key");

  // 3. Get or create collection
  const users = db.collection("users", userSchema);

  // 4. Remove old Datas
  await users.deleteMany({});

  // 4. Prepare test data
  const data = [
    {
      id: 1,
      name: "Alice",
      age: 30,
      tags: ["engineer", "blogger"],
      meta: { city: "Delhi", active: true },
    },
    {
      id: 2,
      name: "Bob",
      age: 25,
      tags: ["coder", "blogger"],
      meta: { city: "Mumbai", active: false },
    },
    {
      id: 3,
      name: "Charlie",
      age: 30,
      tags: ["engineer", "designer"],
      meta: { city: "Delhi", active: true },
    },
  ];

  // 5. Insert users
  await users.insertMany(data);
  console.log("Inserted users");

  // 6. find() with filter
  const age30 = await users.find({ age: 30 });
  console.log("Query: { age: 30 } =>", age30);
  assert(age30.length === 2);
  console.log("Found users with age 30");

  // 7. find() with array value matching
  const bloggers = await users.find({ tags: "blogger" });
  console.log("Query: { tags: 'blogger' } =>", bloggers);
  assert(bloggers.length === 2);
  console.log("Found users with tag 'blogger'");

  // 8. find() with nested field query
  const delhiUsers = await users.find({ "meta.city": "Delhi" });
  console.log("Query: { 'meta.city': 'Delhi' } =>", delhiUsers);
  assert(delhiUsers.length === 2);
  console.log("Found users in Delhi");

  // 9. updateOne()
  await users.updateOne({ id: 1 }, { name: "Mona", age: 35 });
  const updatedMona = await users.find({ name: "Mona" });
  console.log("After updateOne({ id: 1 }, { name: 'Mona', age: 35 }) =>", updatedMona);
  assert(updatedMona[0].age === 35);
  console.log("Updated Alice to Mona and changed age");

  // 10. updateMany()
  await users.updateMany({ tags: "blogger" }, { "meta.active": false });
  const allBloggers = await users.find({ tags: "blogger" });
  console.log("Bloggers after updateMany =>", allBloggers);
  for (const u of allBloggers) assert(u.meta.active === false);
  console.log("All bloggers marked inactive");

  // 11. findOne() test
  const single = await users.findOne({ age: 30 });
  console.log("findOne({ age: 30 }) =>", single);
  assert(single.name === "Charlie" || single.name === "Mona");
  console.log("findOne returned a single matching document");

  // 12. find() with sort, limit, skip
  const sorted = await users.find({}, { sort: { age: -1 }, limit: 2, skip: 0 });
  console.log("Sorted descending by age, limit 2 =>", sorted);
  assert(sorted.length === 2); // ensure we have at least 2
  assert(sorted[0].age >= sorted[1].age);
  console.log("Sorting and pagination working");

  // 13. deleteOne()
  await users.deleteOne({ name: "Mona" });
  const afterDeleteOne = await users.find({});
  console.log("After deleteOne({ name: 'Mona' }) =>", afterDeleteOne);
  assert(afterDeleteOne.length === 2);
  console.log("Deleted one user (Mona)");

  // 14. deleteMany()
  await users.deleteMany({ "meta.city": "Delhi" });
  const remaining = await users.find({});
  console.log("Remaining users after deleteMany =>", remaining);
  assert(remaining.length === 1);
  assert(remaining[0].name === "Bob");
  console.log("Deleted all users from Delhi");

  // Final check
  console.log(" All tests passed!");
})();
