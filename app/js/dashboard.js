let trees = [];
let topology = {};
let additionalTrees = {};

function init() {

    $("#tree-container").empty();

    fetch('http://localhost:5000/')
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {

            additionalTrees = {};

            json.map(tree => {

                let date = new Date();
                date.setTime(tree.captured_at/1000000);
                let dateString = date.toUTCString();

                let key = ""+ tree.type + tree.dst_port + date.getMonth() + date.getDay() + date.getHours() + date.getMinutes() + date.getSeconds();

                let l = additionalTrees[key];

                if (typeof l === "undefined") {
                    l = []
                }
                l.push(tree);
                additionalTrees[key] = l;

                if (tree.level < 3) {
                    //return
                } else {
                    
                    let sat = $('<span data-feather="x" style="color:#cc0000;width:24px;height:24px"></span>')
                    if (tree.is_sat) {
                        sat = $('<span data-feather="check" style="color:#009900;width:24px;height:24px"></span>')
                    }

                    let label = $("<p></p>")
                        .html(`<b>Captured At:</b>${dateString}<br/><b>Dst IP:</b>${tree.dst_ip}<br/><b>Valid:</b>`)
                        .append(sat);

                    let t = $("<div></div>")
                        .addClass("col-md-3")
                        .addClass("min-width-300-md");

                    let img = $("<img/>")
                        .attr("src", `data:image/png;base64, ${tree.nodes_img}`);

                    let link = $( "<a/>", {
                        html    : "View All...",
                        "class" : "view-more",
                        href    : "#",
                        id      : key,
                        "data-key": key,
                        "data-toggle": "modal" ,
                        "data-target": "#viewMoreModal"
                    });

                    trees.push(tree.nodes);

                    t.append(label)
                        .append(img)
                        .append(link);

                    $("#tree-container")
                        .append(t);

                }

                $("#tree-container")
                    .removeClass("d-none");
                $("#loader").addClass("d-none");

            });
        })
        .then(function (response){
            feather.replace();
        })
        .catch(error => {
            console.log("Fetching trees data failed", error);
            $("#tree-container").append("<p></p>").text("No flow tree data.");
            $("#tree-container").removeClass("d-none");
            $("#loader").addClass("d-none");
        });
}


function getTopology() {
    fetch('http://localhost:5000/topology')
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {

            //json.map(topology => {
            topology = json;
            let img = $("<img/>")
                .attr("src", `data:image/png;base64, ${json.dot_img}`);

            $("#topology-container").append(img);
            //});
        })
        .catch(error => console.log("Fetching topology failed", error))
}

function getProperties() {
    fetch('http://localhost:5000/smt')
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            props = json;
            let modal = $("#propertiesModal");
            modal.find('.modal-body textarea').val(props.text);
        })
        .catch(error => console.log("Fetching properties failed", error))
}

function handleErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}

$("#btnRefresh").click(
    function () {
        $("#loader").removeClass("d-none");
        $("#tree-container").addClass("d-none");
        init();
    }
);

$("#btnExport").click(
    function () {

        let f = document.createElement("a");
        f.target = "_blank";
        f.download = "trees.dot";
        f.text = "trees.dot";
        f.href = "data:application/x-dot," + trees.join();
        f.click();
    }
);

$("#btnGenerate").click(
    function () {
        $("#generationResult").empty();
        $("generateLoader").removeClass("d-none");

        let modal = $("#generateModal");
        let expression = modal.find('.modal-body input').val();

        console.log("Expression:" + expression);
        console.log("Topology: " + topology.hosts);

        let data = {expression: expression};
        let port = 8800;
        topology.hosts.forEach(function (e) {

            let url = `http://localhost:${port}/generate`;

            fetch(url, {
                method: 'POST',
                body: JSON.stringify(data), // data can be `string` or {object}!
                // headers:{
                //     'Content-Type': 'application/json'
                // }
            }).then(handleErrors)
                .then(res => res.json())
                .then(response => {

                    $("generateLoader").addClass("d-none");

                    let label = $("<div class=\"alert alert-primary\" role=\"alert\"></div>").text(`Packages generated successfully for host: ${response.Host}`)

                    $("#generationResult").append(label);

                    console.log('Success:', JSON.stringify(response));
                })
                .catch(error => {
                    let label = $("<div class=\"alert alert-danger\" role=\"alert\"></div>").text(`There was an error generating packages: ${error.message}`)
                    $("#generationResult").append(label);

                    console.error('Error:', error)
                });
            port++;
        });
        setTimeout(init(), 4000);
    }
);

$("#generateModal").on('hidden.bs.modal', function () {
    $("#generationResult").empty();
    $(this).find('.modal-body input').val("")
});

$('#viewMoreModal').on('show.bs.modal', function (event) {
    let link = $(event.relatedTarget);
    let key = link.data('key');

    let modal = $(this);
    let c = modal.find('.modal-body .container');
    c.empty();
    additionalTrees[key].map( tree => {

        let t = $("<div></div>")
            .addClass("col-md-3")
            .addClass("min-width-300-md");

        let img = $("<img/>")
            .attr("src", `data:image/png;base64, ${tree.nodes_img}`);
        t.append(img);
        c.append(t);
        });
});

$("#btnSaveProperties").click(
    function () {
        $("#saveResult").empty();
        $("saveLoader").removeClass("d-none");

        let url = `http://localhost:5000/smt`;
        let modal = $("#propertiesModal");
        let text = modal.find('.modal-body textarea').val();
        let data = {text:text}
        fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            // headers:{
            //     'Content-Type': 'application/json'
            // }
        })
        .then(handleErrors)
        .then(res => res.json())
        .then(res => {
            $("saveLoader").addClass("d-none");

            let label = $("<div class=\"alert alert-primary\" role=\"alert\"></div>").text(`Properties saved successfully`)

            $("#saveResult").append(label);
            console.log("save properties: " + JSON.stringify(res));
        })
        .then(function (){
            init();
        })
        .catch(error => {
            let label = $("<div class=\"alert alert-danger\" role=\"alert\"></div>").text(`There was an error saving properties: ${error.message}`)
            $("#saveResult").append(label);
            console.error('Error saving properties:', error)
        });
    
    }
)

$(function () {
    getTopology();
    getProperties();
    init();
});