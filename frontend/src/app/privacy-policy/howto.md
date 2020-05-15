-   https://termly.io

-   ```js
    const fs = require("fs");
    const raw = fs.readFileSync("./raw.html", "utf8");
    const fix = html =>
    	html
    		.replace(/<bdt[^]*?>/gi, "")
    		.replace(/<\/bdt>/gi, "")
    		.replace(/color:[^]*?[;"]/gi, "")
    		.replace(/font-family:[^]*?[;"]/gi, "")
    		.replace(/<span style="\s*?">([^]*?)<\/span>/gi, "$1")
    		.replace(/data-custom-class="body_text"/gi, "")
    		.replace(/data-custom-class="heading_1"/gi, "")
    		.replace(/data-custom-class="heading_2"/gi, "")
    		.replace(/data-custom-class="link"/gi, "")
    		.replace(/data-custom-class="body"/gi, "")
    		.replace(/data-custom-class="subtitle"/gi, "")
    		.replace(/data-custom-class="title"/gi, "")
    		.replace(/class="[^]*?"/gi, "")
    		.replace(/<style>[^]*?<\/style>/gi, "")
    		.replace(/<span\s*?><\/span>/gi, "")
    		.replace(/<span style="font-size: 15px;"><\/span>/gi, "")
    		.replace(/\t/gi, "")
    		.replace(/\n/gi, " ");
    let out = raw;
    for (let i = 0; i < 200; i++) {
    	out = fix(out);
    }
    fs.writeFileSync("./privacy-policy.html", out);
    ```

-   open in chrome and save to new html file
