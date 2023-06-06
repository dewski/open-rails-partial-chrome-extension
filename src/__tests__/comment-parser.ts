import {
  parsePartialComment,
  nearestPartialComment,
  walkPartialComments,
} from "../partials";

describe("walkPartialComments", () => {
  test("does not match comments throughout document without a matching BEGIN file path", () => {
    document.body.innerHTML = `
      <!-- BEGIN The start of something great -->
      <html>
        <head>
          <title>My App</title>
        </head>
        <body>
          <!-- BEGIN The <body> -->
          <!-- Start of root element -->
          <div id="root"></div>
        </body>
      </html>
      <!-- END The start of something great -->
    `;
    const element = document.getElementById("root") as HTMLElement;
    const partials = walkPartialComments(element);

    expect(partials).toEqual([]);
  });

  test("ignores sibling empty partial comments", () => {
    document.body.innerHTML = `
      <!-- BEGIN app/layouts/application.html.erb -->
      <html>
        <head>
          <title>My App</title>
        </head>
        <body>
          <!-- BEGIN app/shared/_stats.html.erb -->
          <!-- END app/shared/_stats.html.erb -->
          <!-- BEGIN app/users/index.html.erb -->
          <div id="root"></div>
          <!-- END app/users/index.html.erb -->
        </body>
      </html>
      <!-- END app/layouts/application.html.erb -->
    `;
    const element = document.getElementById("root") as HTMLElement;
    const partials = walkPartialComments(element);

    expect(partials).toEqual([
      "app/users/index.html.erb",
      "app/layouts/application.html.erb",
    ]);
  });

  test("locates sibling partial comment", () => {
    document.body.innerHTML = `
      <!-- BEGIN app/layouts/application.html.erb -->
      <html>
        <head>
          <title>My App</title>
        </head>
        <body>
          <!-- BEGIN app/shared/_stats.html.erb -->
          <!-- BEGIN app/users/index.html.erb -->
          <div id="root"></div>
          <!-- END app/users/index.html.erb -->
          <!-- END app/shared/_stats.html.erb -->
        </body>
      </html>
      <!-- END app/layouts/application.html.erb -->
    `;
    const element = document.getElementById("root") as HTMLElement;
    const partials = walkPartialComments(element);

    expect(partials).toEqual([
      "app/users/index.html.erb",
      "app/shared/_stats.html.erb",
      "app/layouts/application.html.erb",
    ]);
  });

  test("ignores non-partial comments between valid partial comments", () => {
    document.body.innerHTML = `
      <!-- BEGIN app/layouts/application.html.erb -->
      <html>
        <head>
          <title>My App</title>
        </head>
        <body>
          <!-- BEGIN app/users/index.html.erb -->
            <!-- My unrelated comment -->
            <!-- BEGIN app/users/_user.html.erb -->
              <div id="root"></div>
            <!-- END app/users/_user.html.erb -->
          <!-- END app/users/index.html.erb -->
        </body>
      </html>
      <!-- END app/layouts/application.html.erb -->
    `;
    const element = document.getElementById("root") as HTMLElement;
    const partials = walkPartialComments(element);

    expect(partials).toEqual([
      "app/users/_user.html.erb",
      "app/users/index.html.erb",
      "app/layouts/application.html.erb",
    ]);
  });

  test("ignores sibling partial comments", () => {
    document.body.innerHTML = `
      <!-- BEGIN app/layouts/application.html.erb -->
      <html>
        <head>
          <title>My App</title>
        </head>
        <body>
          <!-- BEGIN app/users/index.html.erb -->
            <!-- BEGIN app/shared/_stats.html.erb -->
              <div id="stats"></div>
            <!-- END app/shared/_stats.html.erb -->
            <!-- BEGIN app/users/_user.html.erb -->
              <div id="root"></div>
            <!-- END app/users/_user.html.erb -->
          <!-- END app/users/index.html.erb -->
        </body>
      </html>
      <!-- END app/layouts/application.html.erb -->
    `;
    const element = document.getElementById("root") as HTMLElement;
    const partials = walkPartialComments(element);

    expect(partials).toEqual([
      "app/users/_user.html.erb",
      "app/users/index.html.erb",
      "app/layouts/application.html.erb",
    ]);
  });

  test("locates sibling partial comment with text in between", () => {
    document.body.innerHTML = `
      <!-- BEGIN app/layouts/application.html.erb -->
      <html>
        <head>
          <title>My App</title>
        </head>
        <body>
          <!-- BEGIN app/shared/_stats.html.erb -->
            My text
            <!-- BEGIN app/users/index.html.erb -->
            <div id="root"></div>
            <!-- END app/users/index.html.erb -->
          <!-- END app/shared/_stats.html.erb -->
        </body>
      </html>
      <!-- END app/layouts/application.html.erb -->
    `;
    const element = document.getElementById("root") as HTMLElement;
    const partials = walkPartialComments(element);

    expect(partials).toEqual([
      "app/users/index.html.erb",
      "app/shared/_stats.html.erb",
      "app/layouts/application.html.erb",
    ]);
  });
});

describe("parsePartialComment", () => {
  test("parses beginning partial path", () => {
    document.body.innerHTML = "<!-- BEGIN app/users/index.html.erb -->";
    const comment = document.body.firstChild as HTMLElement;
    const partialComment = parsePartialComment(comment);

    expect(comment.nodeName).toBe("#comment");
    expect(partialComment?.path).toBe("app/users/index.html.erb");
    expect(partialComment?.begin).toBe(true);
  });

  test("parses end partial path", () => {
    document.body.innerHTML = "<!-- END app/users/index.html.erb -->";
    const comment = document.body.firstChild as HTMLElement;
    const partialComment = parsePartialComment(comment);

    expect(comment.nodeName).toBe("#comment");
    expect(partialComment?.path).toBe("app/users/index.html.erb");
    expect(partialComment?.begin).toBe(false);
  });

  test("does not match comment not starting with BEGIN", () => {
    document.body.innerHTML = "<!-- app/users/index.html.erb -->";
    const comment = document.body.firstChild as HTMLElement;
    const partialComment = parsePartialComment(comment);

    expect(comment.nodeName).toBe("#comment");
    expect(partialComment).toBeNull();
  });
});

describe("nearestPartialComment", () => {
  test("finds nearest partial comment from previousSibling", () => {
    document.body.innerHTML = `
      <!-- BEGIN app/layouts/application.html.erb -->
      <html>
        <head>
          <title>My App</title>
        </head>
        <body>
          <!-- BEGIN app/shared/_stats.html.erb -->
          <!-- END app/shared/_stats.html.erb -->
          <!-- BEGIN app/users/index.html.erb --><div id="root"></div><!-- END app/users/index.html.erb -->
        </body>
      </html>
      <!-- END app/layouts/application.html.erb -->
    `;
    const element = document.getElementById("root");
    const partialComment = nearestPartialComment(element as HTMLElement);

    expect(partialComment?.node).toEqual(element?.previousSibling);
    expect(partialComment?.begin).toBe(true);
    expect(partialComment?.path).toBe("app/users/index.html.erb");
  });

  test("finds nearest partial comment from nested element", () => {
    document.body.innerHTML = `
      <!-- BEGIN app/layouts/application.html.erb -->
      <html>
        <head>
          <title>My App</title>
        </head>
        <body>
          <!-- BEGIN app/shared/_stats.html.erb -->
          <!-- END app/shared/_stats.html.erb -->
          <!-- BEGIN app/users/index.html.erb -->
          <div id="root">
            <header>
              <h1>Header</h1>
            </header>
            <div id="nested">
            </div>
          </div>
          <!-- END app/users/index.html.erb -->
        </body>
      </html>
      <!-- END app/layouts/application.html.erb -->
    `;
    const element = document.getElementById("nested");
    const partialComment = nearestPartialComment(element as HTMLElement);

    expect(partialComment?.begin).toBe(true);
    expect(partialComment?.path).toBe("app/users/index.html.erb");
  });

  test("finds outer most partial in document", () => {
    document.body.innerHTML = `
      <!-- BEGIN app/layouts/application.html.erb -->
      <html>
        <head>
          <title>My App</title>
        </head>
        <body>
          <header>
            <h1>Header</h1>
          </header>
          <!-- BEGIN app/shared/_stats.html.erb -->
          <!-- END app/shared/_stats.html.erb -->
          <!-- BEGIN app/users/index.html.erb -->
          <div id="root"></div>
          <!-- END app/users/index.html.erb -->
        </body>
      </html>
      <!-- END app/layouts/application.html.erb -->
    `;
    const element = document.querySelector("header");
    const partialComment = nearestPartialComment(element as HTMLElement);

    expect(partialComment?.path).toBe("app/layouts/application.html.erb");
    expect(partialComment?.begin).toBe(true);
  });
});
