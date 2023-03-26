import { SlimView } from "https://greergan.github.io/slim.view/index.ts";
const view:SlimView = new SlimView("https://greergan.github.io");
const html_view:string = await view.render({page:{title:"fun"}, site:{copyright:{started_date:"2023",by:"Jeff Greer"}}}, "examples/helloworld.html");
console.log(html_view);
