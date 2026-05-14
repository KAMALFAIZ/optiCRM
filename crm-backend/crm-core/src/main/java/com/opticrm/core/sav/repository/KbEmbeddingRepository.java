package com.opticrm.core.sav.repository;

import com.opticrm.core.sav.entity.KbEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KbEmbeddingRepository extends JpaRepository<KbEmbedding, UUID> {

    List<KbEmbedding> findByArticleIdAndLangue(UUID articleId, String langue);

    void deleteByArticleId(UUID articleId);

    @Query("SELECT e FROM KbEmbedding e JOIN e.article a " +
           "WHERE a.actif = true AND a.valideParKamal = true " +
           "AND a.categorie = :categorie AND e.langue = :langue")
    List<KbEmbedding> findForSearch(@Param("categorie") String categorie,
                                    @Param("langue") String langue);

    @Query("SELECT e FROM KbEmbedding e JOIN e.article a " +
           "WHERE a.actif = true AND a.valideParKamal = true AND e.langue = :langue")
    List<KbEmbedding> findAllActiveByLangue(@Param("langue") String langue);
}
