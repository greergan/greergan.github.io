import * as slim from "https://greergan.github.io/slim.view/index.ts";
const view:slim.view.SlimView = new slim.view.SlimView("https://greergan.github.io");
const html_view:string = view.render({page:{title:"fun"}, site:{copyright:{started_date:"2023",by:"Jeff Greer"}}}, "examples/helloworld.html");
console.log(html_view);