$(document).ready(function () {
                var C_Election = "";

                $('#buttonRec').click(function () {

                    $('.ong_stat').removeClass("act").addClass("desact");
                    $(".ong_data").hide();

                    var sr = document.getElementById("buttonRec").src.split('/');
                    if (sr[sr.length - 1] == "search0.png") {
                        //if ($('#DDLCommune').val() != null && $('#DDLCommune').val() != 0) {
                        $("#DDLRegion").prop("disabled", true);
                        $("#DDLProvince").prop("disabled", true);
                        $("#DDLCommune").prop("disabled", true);
                        $("#DDLCirc").prop("disabled", true);
                        // }

                        $('#buttonRec').attr('src', '../../images/search1.png');
                    } else {
                        $("#DDLRegion").prop("disabled", false);
                        $("#DDLProvince").prop("disabled", false);
                        $("#DDLCommune").prop("disabled", false);
                        $("#DDLCirc").prop("disabled", false);
                        $('#buttonRec').attr('src', '../../images/search0.png');

                        $("#DDLRegion").val(0).change();

                        $('#DDLCirc').empty();

                        $('#DDLCirc').append(
                           $('<option>', {
                               value: 0,
                               text: '-اختر الدائرة الإنتخابية-'
                           }, '<option/>'));
                        $('#DDLProvince').empty();
                        $('#DDLProvince').append(
                                $('<option>', {
                                    value: 0,
                                    text: '-اختر العمالة أو الإقليم-'
                                }, '<option/>'));


                        $('#DDLCommune').empty();


                        // $('#DDLCirc').html("");

                        return;
                    }


                    var Region = $('#DDLRegion').val();
                    var province = ($('#DDLProvince').val() == null ? 0 : $('#DDLProvince').val());
                    var Commune = ($('#DDLCommune').val() == null ? 0 : $('#DDLCommune').val());
                    var Circ = ($('#DDLCirc').val() == null ? 0 : $('#DDLCirc').val());



                    



                    if (Circ == 0) {
                        $('#link_ong1').click(function () {
                            alert('المرجو إختيار دائرة إنتخابية');
                        });

                    }



                    if (Commune == 0) {
                        $('#link_ong2').click(function () {
                            alert('المرجو إختيار  جماعة أو مقاطعة');
                        });
                    }


                    
                    $('#link_ong3').removeClass("desact");
                    $('#link_ong4').removeClass("desact");
                    $('#link_ong5').removeClass("desact");





                    if (Circ != 0) {
                        $('#link_ong1').removeClass("desact").addClass("act");
                        $('#link_ong2').removeClass("desact");
                        $('#ong1').show();
                    } else {
                        if (Commune != 0) {
                            $('#link_ong2').removeClass("desact").addClass("act");
                            $('#ong2').show();
                        } else {
                            $('#link_ong3').addClass("act");
                            $('#ong3').show();
                        }
                    }

                    

                   
                    if (Region == 0) { $('#ong4_container_local').hide(); } else { $('#ong4_container_local').show(); }


                    C_Election=15;

                    if (Circ != 0) {

                         
                    if (C_Election==9)
                    {
                        if (Circ == 26584 || Circ == 6086 || Circ == 11553 || Circ == 26513 || Circ == 16689 || Circ == 11950 || Circ == 11801 || Circ == 5672 || Circ == 26500 || Circ == 11956) {
                            $(".ResultPVMsg, .ResultPVMsgTP").html("<div class='alert no_data'>لم يعلن عن انتخاب أي مرشح بسبب عدم إجراء عمليات الاقتراع في الدائرة الانتخابية</div>");
                            $(".MSGHideData").hide();
                            $(".MSGHideDataTP").hide();

                        }
                        else {

                            if (Circ == 16829 || Circ == 21103 || Circ == 4052 || Circ == 2123 || Circ == 4865 || Circ == 2327 || Circ == 22679) {
                                $(".ResultPVMsg").html("<div class='alert no_data'>لم يعلن عن انتخاب المرشح الفريد لكونه لم يحصل على ما لا يقل عن خمس أصوات الناخبين المقيدين بالدائرة الانتخابية</div>");
                                $(".MSGHideData").hide();
                            }

                            getResultatsDesPV_com("../../Electionweb.asmx/getResultatsPV_Com", Region, province, Commune, Circ, C_Election);
                        }

                        }

                    

                    if (C_Election==15)
                        {

                         if (Circ == 1426 || Circ == 21252) {
                                $(".ResultPVMsg").html("<div class='alert no_data'>لم يعلن عن انتخاب المرشح الفريد لكونه لم يحصل على ما لا يقل عن خمس أصوات الناخبين المقيدين بالدائرة الانتخابية</div>");
                                $(".MSGHideData").hide();
                            }

                            getResultatsDesPV_com("../../Electionweb.asmx/getResultatsPV_Com", Region, province, Commune, Circ, C_Election);
                        }



                    }







                    if (C_Election== 5 && Circ != 26584 && Circ != 6086 && Circ != 11553 && Circ != 26513 && Circ != 16689 && Circ != 11950 && Circ != 11801 && Circ != 5672 && Circ != 26500 && Circ != 11956 && Circ != 16829 && Circ != 21103 && Circ != 4052 && Circ != 2123 && Circ != 4865 && Circ != 2327 && Circ != 22679) 
                        or (C_Election== 15 && Circ != 1426 && Circ != 21252)
                    
                    
                    {
                        
                        

                        if (Commune != 0) { getListeElus_com("../../Electionweb.asmx/getListElus_Com", Region, province, Commune, Circ, C_Election); }
                        ResultatgetPieChartData_com("../../Electionweb.asmx/GetStatistiqueResultatParPartie_Com", Region, province, Commune, Circ, C_Election);
                        ResultatgetChartGenre_com("../../Electionweb.asmx/GetStatistiqueResultatGenre_Com", Region, province, Commune, Circ, C_Election);
                        ResultatgetPiechartNiveauEtude_com("../../Electionweb.asmx/GetStatistiqueResultatNiveauEtude_Com", Region, province, Commune, Circ, C_Election);
                        ResultatgetChatTracheAge_com("../../Electionweb.asmx/GetStatistiqueResultatTracheAge_Com", Region, province, Commune, Circ, C_Election);
                    }

                    
                    //getBarChart_couvertue("../../Electionweb.asmx/getCouverturePol", Region, province, Commune, Circ);
                    ResultatTauxParticipation_com("../../Electionweb.asmx/GetStatistiqueResultatTauxParticipation_Com", Region, province, Commune, Circ, C_Election);







                });

            });