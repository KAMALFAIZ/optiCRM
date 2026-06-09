
 

/*-----------------------datatables----------------------------------*/
function getListeElus_com(ajaxURL, Region, province, Commune, Circ, C_Election) {

    $.ajax({
        type: "POST",
        url: ajaxURL,
        data: JSON.stringify({ Region: Region, province: province, Commune: Commune, Circ: Circ, C_Election: C_Election }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        cache: false,

        success: function (Result) {

            // DataJson = $.parseJSON(data);
            id_Conteneur = "ong3_container_tranche";
            TitreLocalisation = "";
            Result = Result.d;
            var data = [];
            // $('#listElutable').append("<tbody>");
            for (var i in Result) {
                var item = [Result[i].Name, Result[i].NameOrgPolitique, Result[i].CodesymbomePartie, Result[i].Id_Candidat];
                // $('#listBVtable').append("<tr><td style='font-weight:bold;'>" + Result[i].Circ + "</td><td style='font-weight:bold;'>" + Result[i].NumBureauVote + "</td><td style='font-weight:bold;'>" + Result[i].Adress + " </td><td style='font-weight:bold;'>" + Result[i].Lieu + "</td></tr>");
                data.push(item);

            }
 
            $('#listElutable').dataTable({
                "language": {
                    "url": "../scripts/Arabic.txt",
                    "emptyTable": "sdfsdfsdfsdf"
                },

                "paging": true,
                "ordering": false,
                "searching": false,
                "info": false,
                "data": data,
                "columns": [

                    { "title": "الإسم الشخصي والعائلي" },
                    { "title": "الانتماء السياسي" },
                    { "title": "الرمز", "class": "center" },
                    { "title": "الصورة", "class": "center" }



                ],
                "columnDefs": [
                    {
                        // The `data` parameter refers to the data for the cell (defined by the
                        // `data` option, which defaults to the column being worked with, in
                        // this case `data: 0`.
                        "render": function (data, type, row) {
                            return '<img src="logos_pp/' + data + '.JPG" style="width=300px;height=300px;" />';
                        },
                        "targets": 2 // column index 
                    },


                    {
                        // The `data` parameter refers to the data for the cell (defined by the
                        // `data` option, which defaults to the column being worked with, in
                        // this case `data: 0`.
                        "render": function (data, type, row) {

                            return '<img src="photos_candidat/' + data + '.JPG" style="width=300px;height=300px;" />';
                        },
                        "targets": 3 // column index 
                    }

                ],
                initComplete: function(settings){
                    var api = new $.fn.dataTable.Api( settings );
            
                    // Replace with your actual condition
                    console.log(C_Election);
                    if(C_Election == "15"){

                        var showColumn = false;
                    } 
            
                    api.columns([3]).visible(showColumn);
                }



            });


 
        }
    });

}
 
function getResultatsDesPV_com(ajaxURL, Region, province, Commune, Circ, C_Election) {

    $.ajax({
        type: "POST",
        url: ajaxURL,
        data: JSON.stringify({ Region: Region, province: province, Commune: Commune, Circ: Circ, C_Election: C_Election }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        cache: false,

        success: function (Result) {

            // DataJson = $.parseJSON(data);

            id_Conteneur = "ong3_container_tranche";
            TitreLocalisation = "";
            Result = Result.d;
            var data = [];
            // $('#listElutable').append("<tbody>");
            for (var i in Result) {
                var item = [Result[i].Nom_Partis, Result[i].PrenomNom_Cand, format_Millier(Result[i].N_Voix), format_Millier(Result[i].N_Elus)];
                // $('#listBVtable').append("<tr><td style='font-weight:bold;'>" + Result[i].Circ + "</td><td style='font-weight:bold;'>" + Result[i].NumBureauVote + "</td><td style='font-weight:bold;'>" + Result[i].Adress + " </td><td style='font-weight:bold;'>" + Result[i].Lieu + "</td></tr>");
                data.push(item);

            }

 
            $('#ResultPVtable').dataTable({
                "language": {
                    "url": "../scripts/Arabic.txt"
                },
                "paging": true,
                "ordering": false,
                "searching": false,
                "info": false,
                "data": data,
                "columns": [

                    { "title": "الهيئة السياسية", "width": "30%" },
                    { "title": "إسم وكيل اللائحة أو المرشح", "width": "26%" },
                    { "title": "عدد الأصوات المحصل عليها", "class": "center", "width": "29%" },
                    { "title": "عدد المقاعد", "class": "center", "width": "15%" }



                ],
                initComplete: function(settings){
                    var api = new $.fn.dataTable.Api( settings );
            
                    // Replace with your actual condition
                    console.log(C_Election);
                    if(C_Election == "15"){

                        var showColumn = false;
                    } 
            
                    api.columns([3]).visible(showColumn);
                }



            });

 
        }
    });

}
/*-----------------------end datatables----------------------------------*/
 
function ResultatgetPieChartData_com(ajaxURL, Region, province, Commune, Circ, C_Election) {
 

    $.ajax({
        type: "POST",
        url: ajaxURL,
        data: JSON.stringify({ Region: Region, province: province, Commune: Commune, Circ: Circ, C_Election: C_Election }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        cache: false,

        success: function (Result) {

            // DataJson = $.parseJSON(data);
            id_Conteneur = "ong1_container";
            TitreLocalisation = "";
            Result = Result.d;
            var data = [];
            for (var i in Result) {
            

                var serie = {
                    "label": Result[i].Name,
                    "value": Result[i].Value_decimal,
                    "displayValue": Result[i].Name+','+Result[i].Value_decimal.toFixed(2)+"%",
                    "total": Result[i].label,
                    "Nbre_Elus": Result[i].Value,
                    "LibA_Parti" : Result[i].LibA_Parti
                };
                data.push(serie);
            }
            //pie_chart(Id div qui va contenir le chart, data sour format json, titre du graphe avec le niveau d'affichage[region,prov,commune,circ]);	 
            //var chart = new Highcharts.Chart(pie_chart(id_Conteneur, data, TitreLocalisation));
            //chart.redraw();
            if (typeof Result[0] === 'undefined') {
                nbrsiege = "";
                souttitre = "";

            } else { nbrsiege = Result[0].label; souttitre = ' عدد المقاعد'; }

             
            var xname = "الأحزاب السياسية";
            var yname = "النتائج (%)";
            var tableContainerId = 'table-container';
            $("#table-container").hide();
            var fChart = pie2d_fchart_multi(id_Conteneur, data, souttitre, nbrsiege, '100%', '100%', xname, yname); 
            
            if(Result.length > 0 && Result[0] && Result[0].LibA_Parti !=null) { 
                displayPieResultAsTable(data);
                $("#table-container").show();
            }
        }
    });
}

function ResultatgetPieChartData_MembreBureau_com(ajaxURL, Region, C_Election) {



    $.ajax({
        type: "POST",
        url: ajaxURL,
        data: JSON.stringify({ Region: Region, C_Election: C_Election }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        cache: false,

        success: function (Result) {

            // DataJson = $.parseJSON(data);
            id_Conteneur = "ong1_container";
            TitreLocalisation = "";
            Result = Result.d;
            var data = [];
            for (var i in Result) {
                var serie = {
                    "label": Result[i].Name,
                    "value": Result[i].Value_decimal,
                    "displayValue": Result[i].Name+','+Result[i].Value_decimal.toFixed(2)+"%",
                    "total": Result[i].label,
                    "Nbre_Elus": Result[i].Value,
                    "LibA_Parti" : Result[i].LibA_Parti
                };
                data.push(serie);
            } 
            //pie_chart(Id div qui va contenir le chart, data sour format json, titre du graphe avec le niveau d'affichage[region,prov,commune,circ]);	 
            //var chart = new Highcharts.Chart(pie_chart(id_Conteneur, data, TitreLocalisation));
            //chart.redraw();
            if (typeof Result[0] === 'undefined') {
                nbrsiege = '';
                souttitre = "";

            } else {
                nbrsiege = Result[0].label;
                souttitre = ' عدد المكاتب ';
            }

         
           var xname = "الأحزاب السياسية";
            var yname = "النتائج (%)";
            var tableContainerId = 'table-container'; 
            $("#table-container").hide();
            var fChart = pie2d_fchart_multi(id_Conteneur, data, souttitre, nbrsiege, '100%', '100%', xname, yname); 
            if(Result.length > 0 && Result[0] && Result[0].LibA_Parti !=null) { 
                displayPieResultAsTableMV(data);
                $("#table-container").show();
            }
        }
    });
}
function displayPieResultAsTable(datas){
    
    listPPResultTable = $('#listPPResult').dataTable({
        "language": {
            "url": "../scripts/Arabic.txt"
        },
        "paging": false,
        "ordering": true,
        "searching": false,
        "responsive": true,
        "info": false,
        "data": datas,
        "scrollY": "250px",
        "scrollCollapse": true,
        "iDisplayLength": "-1",
        "order": [
            [2, "desc"]
        ], 
        // "pageLength": 5,
        // "lengthMenu": [
        //     [ 5, 10, 15,30, -1 ],
        //     [ '5', '10', '15','30', 'Tous' ]
        // ],
        "columns": [
            // { "title": "الشعار" },
            { "title": "الهيئة السياسية" },
            { "title": "عدد المقاعد",
               "width": "100px" },
            { "title": "النتائج",
            "width": "60px" } 
            


        ],
        "columnDefs": [
    // {
    //     // The `data` parameter refers to the data for the cell (defined by the
    //     // `data` option, which defaults to the column being worked with, in
    //     // this case `data: 0`.
    //     "data": null,
    //     "render": function (data, type, full, meta) {
    //         return '<img src="logos_pp/' + full.label + '.JPG" style="width:40px;height:auto;" />';
    //     },
    //     "targets":0 // column index 
    // },
    {
        // The `data` parameter refers to the data for the cell (defined by the
        // `data` option, which defaults to the column being worked with, in
        // this case `data: 0`.
        "data": "LibA_Parti", 
        "targets":0 // column index 
    },{
        // The `data` parameter refers to the data for the cell (defined by the
        // `data` option, which defaults to the column being worked with, in
        // this case `data: 0`.
        // "data": null, 
        // "render": function (data, type, full, meta) {
        //     return ( (full.value  / 100) * full.total).toFixed(0);
        // },
        "data": "Nbre_Elus", 
        
        "targets":1 // column index 
    },{
        // The `data` parameter refers to the data for the cell (defined by the
        // `data` option, which defaults to the column being worked with, in
        // this case `data: 0`.
        // "data": "value",
        // "render": function (data, type, full, meta) {
        //     return (data/full.total *100).toFixed(2) +"%";
        // },
        "data" : "value",
        "render": function (data, type, full, meta) {
            return  data.toFixed(2) +"%";
        },
        "targets":2 // column index 
    }

        ],  
        "initComplete": function(settings, json) { 
            $('#link_ong3').click(function () {
                $("#listPPResult").DataTable().columns.adjust();
            })
            // $('#listPPResult').append('<tfoot><th></th></tfoot>');
      
        },    	
        "footerCallback": function ( row, data, start, end, display ) {
        	var api = this.api(), data; 
          
            var tot = datas[0].total;
	        // Update footer Column "quantita"
        
        	// $( api.column(0).footer()).html(
                
            // );
            $( api.column(0).footer()).html(
                 'المجموع : ' + tot.toString() + ' (مقعد) '
           );
            
		}   
 
     
    
    });
}
function displayPieResultAsTableMV(datas){
    
    listPPResultTable = $('#listPPResult').dataTable({
        "language": {
            "url": "../scripts/Arabic.txt"
        },
        "paging": false,
        "ordering": true,
        "searching": false,
        "responsive": true,
        "info": false,
        "data": datas,
        "scrollY": "250px",
        "scrollCollapse": true,
        "iDisplayLength": "-1",
        "order": [
            [2, "desc"]
        ], 
        // "pageLength": 5,
        // "lengthMenu": [
        //     [ 5, 10, 15,30, -1 ],
        //     [ '5', '10', '15','30', 'Tous' ]
        // ],
        "columns": [
            // { "title": "الشعار" },
            { "title": "الهيئة السياسية" },
            { "title": "عدد المقاعد",
               "width": "100px" },
            { "title": "النتائج",
            "width": "60px" } 
            


        ],
        "columnDefs": [
    // {
    //     // The `data` parameter refers to the data for the cell (defined by the
    //     // `data` option, which defaults to the column being worked with, in
    //     // this case `data: 0`.
    //     "data": null,
    //     "render": function (data, type, full, meta) {
    //         return '<img src="logos_pp/' + full.label + '.JPG" style="width:40px;height:auto;" />';
    //     },
    //     "targets":0 // column index 
    // },
    {
        // The `data` parameter refers to the data for the cell (defined by the
        // `data` option, which defaults to the column being worked with, in
        // this case `data: 0`.
        "data": "LibA_Parti", 
        "targets":0 // column index 
    },{
        // The `data` parameter refers to the data for the cell (defined by the
        // `data` option, which defaults to the column being worked with, in
        // this case `data: 0`.
        // "data": null, 
        // "render": function (data, type, full, meta) {
        //     return ( (full.value  / 100) * full.total).toFixed(0);
        // },
        "data": "Nbre_Elus", 
        
        "targets":1 // column index 
    },{
        // The `data` parameter refers to the data for the cell (defined by the
        // `data` option, which defaults to the column being worked with, in
        // this case `data: 0`.
        "data": "value",
        "render": function (data, type, full, meta) {
            return data.toFixed(2) +"%";
        },
        "targets":2 // column index 
    }

        ],  
        "initComplete": function(settings, json) { 
            $('#link_ong2').click(function () {
                $("#listPPResult").DataTable().columns.adjust();
            })
            // $('#listPPResult').append('<tfoot><th></th></tfoot>');
      
        },    	
        "footerCallback": function ( row, data, start, end, display ) {
        	var api = this.api(), data; 
          
            var tot = datas[0].total;
	        // Update footer Column "quantita"
        
        	// $( api.column(0).footer()).html(
                
            // );
            $( api.column(0).footer()).html(
                 'المجموع : ' + tot.toString() + ' (مقعد) '
           );
            
		}   
 
     
    
    });
}
function ResultatgetChartGenre_com(ajaxURL, Region, province, Commune, Circ, C_Election) {

    $.ajax({
        type: "POST",
        url: ajaxURL,
        data: JSON.stringify({ Region: Region, province: province, Commune: Commune, Circ: Circ, C_Election: C_Election }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        cache: false,

        success: function (Result) {

            // DataJson = $.parseJSON(data);
            id_Conteneur = "ong3_container_genre";
            TitreLocalisation = "توزيع المنتخبين حسب النوع";
            Result = Result.d;
            var data = [];
            for (var i in Result) {
                if (typeof Result[0] !== 'undefined') {
                    var serie = {
                        "label": Result[i].Name == "homme" ? "رجال" : "نساء",
                        "value": Result[i].Value_decimal,
                    };
                    data.push(serie);
                }
            }  
            var width= "100%";
            var height= "250"; 
            pie3d_fchart(id_Conteneur, data, TitreLocalisation, "", width, height);
           
        }
    });
}
 
function ResultatgetPiechartNiveauEtude_com(ajaxURL, Region, province, Commune, Circ, C_Election) {

    $.ajax({
        type: "POST",
        url: ajaxURL,
        data: JSON.stringify({ Region: Region, province: province, Commune: Commune, Circ: Circ, C_Election: C_Election }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        cache: false,

        success: function (Result) {

            // DataJson = $.parseJSON(data);
            id_Conteneur = "ong3_container_nivetud";
            TitreLocalisation = "توزيع المنتخبين حسب المستوى الدراسي";
            Result = Result.d;
            var data = [];
            for (var i in Result) {
                var serie = {
                    "label": Result[i].Name,
                    "value": Result[i].Value_decimal,
                };
                data.push(serie);
            }
            var yname= "العدد";
            var xname= "المستوى";
            var prefix= "%";
            var width= "100%";
            var height= "350";
            var subCaption = "";
            column2d_fchart(id_Conteneur, data, TitreLocalisation, subCaption , xname, yname, prefix , width, height);

  
        }
    });

}
 
function ResultatgetChatTracheAge_com(ajaxURL, Region, province, Commune, Circ, C_Election) {

    $.ajax({
        type: "POST",
        url: ajaxURL,
        data: JSON.stringify({ Region: Region, province: province, Commune: Commune, Circ: Circ, C_Election: C_Election }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        cache: false,

        success: function (Result) {

            // DataJson = $.parseJSON(data);
            id_Conteneur = "ong3_container_tranche";
            TitreLocalisation = "توزيع المنتخبين حسب الفئات العمرية";
            Result = Result.d;
            var data = [];
            for (var i in Result) {
                var serie = {
                    "label": Result[i].Name,
                    "value": Result[i].Value_decimal,
                };
                data.push(serie);
            }
   
            var yname= "العدد";
            var xname= "السن";
            var prefix= "%";
            var width= "100%";
            var height= "350";
            var subCaption = "";
            column2d_fchart(id_Conteneur, data, TitreLocalisation, subCaption , xname, yname, prefix , width, height);
         }
    });
}

function ResultatTauxParticipation_com(ajaxURL, Region, province, Commune, Circ, C_Election) {

   
    $.ajax({
        type: "POST",
        url: ajaxURL,
        data: JSON.stringify({ Region: Region, province: province, Commune: Commune, Circ: Circ, C_Election: C_Election }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        cache: false,

        success: function (Result) {

            // DataJson = $.parseJSON(data);
            id_Conteneur_local = "ong4_container_local";
            id_Conteneur_national = "ong4_container_national";
            subcaption = "نسبة المشاركة";
            Result = Result.d;
            var datalocal = [];
            var datanationnal = [];
            if (typeof Result[0] !== 'undefined') {
                datalocal.push(Result[0].local_decimal);
                datanationnal.push(Result[0].nationnal_decimal);
            } 
            gauge_fchart(id_Conteneur_local, datalocal[0], "على المستوى المحلي", subcaption,'100%','250');
            gauge_fchart(id_Conteneur_national, datanationnal[0], "على المستوى الوطني", subcaption,'100%','250');
        }
    });


}

function getListeMembreBureau_com(ajaxURL, Commune, C_Election) {

    $.ajax({
        type: "POST",
        url: ajaxURL,
        data: JSON.stringify({ Commune: Commune, C_Election: C_Election }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        cache: false,

        success: function (Result) {

            // DataJson = $.parseJSON(data);
            id_Conteneur = "ong3_container_tranche";
            TitreLocalisation = "";
            Result = Result.d;
            var data = [];
            // $('#listElutable').append("<tbody>");
            for (var i in Result) {
                var item = [Result[i].Nom, Result[i].LibA_Qualite, Result[i].Sigle_Fr, Result[i].Lien_Logo, Result[i].Id_Candidat];
                // $('#listBVtable').append("<tr><td style='font-weight:bold;'>" + Result[i].Circ + "</td><td style='font-weight:bold;'>" + Result[i].NumBureauVote + "</td><td style='font-weight:bold;'>" + Result[i].Adress + " </td><td style='font-weight:bold;'>" + Result[i].Lieu + "</td></tr>");
                data.push(item);

            }






            $('#listElutable').dataTable({
                "language": {
                    "url": "../scripts/Arabic.txt"
                },
                "paging": true,
                "ordering": false,
                "searching": false,
                "info": false,
                "data": data,
                "columns": [

                    { "title": "الإسم الشخصي والعائلي" },
                    { "title": "الصفة" },

                    { "title": "الانتماءالسياسي" },
                    { "title": "الرمز", "class": "center" },
                    { "title": "الصورة", "class": "center" }



                ],
                "columnDefs": [
                    {
                        // The `data` parameter refers to the data for the cell (defined by the
                        // `data` option, which defaults to the column being worked with, in
                        // this case `data: 0`.
                        "render": function (data, type, row) {
                            return '<img src="logos_pp/' + data + '.JPG" style="width=300px;height=300px;" />';
                        },
                        "targets": 3 // column index 
                    },


                    {
                        // The `data` parameter refers to the data for the cell (defined by the
                        // `data` option, which defaults to the column being worked with, in
                        // this case `data: 0`.
                        "render": function (data, type, row) {

                            return '<img src="photos_candidat/' + data + '.JPG" style="width=300px;height=300px;" />';
                        },
                        "targets": 4 // column index 
                    }

                ],
                initComplete: function(settings){
                    var api = new $.fn.dataTable.Api( settings );
            
                    // Replace with your actual condition
                    console.log(C_Election);
                    if(C_Election == "15"){

                        var showColumn = false;
                    } 
            
                    api.columns([4]).visible(showColumn);
                }


            });


       
        }
    });

}

function format_Millier(Valeur)
{ 
 Valeur += '';
  var sep = ' ';
  var reg = /(\d+)(\d{3})/;
  while( reg.test( Valeur)) {
    Valeur = Valeur.replace( reg, '$2' +sep +'$1');
  }
  return Valeur;

}