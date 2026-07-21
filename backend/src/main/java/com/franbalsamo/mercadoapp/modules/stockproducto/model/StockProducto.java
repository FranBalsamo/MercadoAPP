package com.franbalsamo.mercadoapp.modules.stockproducto.model;
import com.franbalsamo.mercadoapp.modules.planilla.model.Planilla;
import com.franbalsamo.mercadoapp.modules.producto.model.Producto;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "Stock_Producto")
public class StockProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne
    @JoinColumn(name = "id_producto")
    private Producto producto;

    @ManyToOne
    @JoinColumn(name = "id_planilla")
    private Planilla planilla;

    @Column(nullable = false)
    private float stock;

    @Column(nullable = false)
    private float stock_vendido;

    // Bloqueo optimista: sin esto, dos ventas concurrentes del mismo producto pueden leer el
    // mismo stock_vendido, pasar ambas el chequeo de disponibilidad y sobrevender. Con @Version,
    // la segunda transaccion en confirmar tira ObjectOptimisticLockingFailureException en vez de
    // pisar silenciosamente el cambio de la primera (ver BoletaService, que la traduce a un
    // mensaje de negocio claro).
    @Version
    private long version;

    public StockProducto(){
        this.stock_vendido = 0;
    }
}