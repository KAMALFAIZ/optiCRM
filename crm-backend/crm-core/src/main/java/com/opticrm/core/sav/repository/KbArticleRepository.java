package com.opticrm.core.sav.repository;

import com.opticrm.core.sav.entity.KbArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KbArticleRepository extends JpaRepository<KbArticle, UUID> {

    Optional<KbArticle> findByCodeArticle(String codeArticle);

    List<KbArticle> findByCategorieAndActifTrueAndValideParKamalTrue(String categorie);

    List<KbArticle> findByActifTrue();

    @Query("SELECT a FROM KbArticle a WHERE a.actif = true AND a.valideParKamal = true " +
           "AND a.categorie = :categorie ORDER BY a.nbUtilisations DESC")
    List<KbArticle> findActiveByCategorie(@Param("categorie") String categorie);

    @Query("SELECT a FROM KbArticle a WHERE a.actif = true AND " +
           "(LOWER(a.motsClesFr) LIKE LOWER(CONCAT('%', :motCle, '%')) OR " +
           " LOWER(a.tags) LIKE LOWER(CONCAT('%', :motCle, '%')) OR " +
           " LOWER(a.titreFr) LIKE LOWER(CONCAT('%', :motCle, '%')))")
    List<KbArticle> searchByMotCle(@Param("motCle") String motCle);
}
